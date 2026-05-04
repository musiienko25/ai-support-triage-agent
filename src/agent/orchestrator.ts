import { randomUUID } from "node:crypto";
import { evaluateRefusal } from "../guardrails/refusal.js";
import { Logger, redactObject } from "../observability/logger.js";
import {
  categorySchema,
  prioritySchema,
  triageOutputSchema,
  type TriageOutput
} from "../schemas/output.js";
import { ticketSchema, type TicketInput } from "../schemas/ticket.js";
import { customerRiskLookup } from "../tools/customerRiskLookup.js";
import { knowledgeBaseSearch } from "../tools/knowledgeBaseSearch.js";

type OrchestratorOptions = {
  verbose?: boolean;
  maxRetries?: number;
  baseBackoffMs?: number;
  deps?: {
    knowledgeBaseSearch?: typeof knowledgeBaseSearch;
    customerRiskLookup?: typeof customerRiskLookup;
  };
};

type RunState = {
  traceId: string;
  steps: string[];
  toolCalls: string[];
  rationaleParts: string[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseBackoffMs: number
): Promise<T> {
  let currentAttempt = 0;
  let lastError: unknown;
  while (currentAttempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (currentAttempt === maxRetries) {
        throw error;
      }
      await sleep(baseBackoffMs * (currentAttempt + 1));
      currentAttempt += 1;
    }
  }
  throw lastError;
}

function computePriority(
  category: string,
  riskLevel: "low" | "medium" | "high",
  priorIncidents: number
): "low" | "medium" | "high" | "critical" {
  if (category === "security_incident" && riskLevel === "high") {
    return "critical";
  }
  if (category === "security_incident") {
    return "high";
  }
  if (riskLevel === "high" || priorIncidents >= 3) {
    return "high";
  }
  if (riskLevel === "medium" || priorIncidents > 0) {
    return "medium";
  }
  return "low";
}

function renderSummary(output: Omit<TriageOutput, "summary">): string {
  return `Ticket ${output.ticketId} classified as ${output.category} with ${output.priority} priority. Next action: ${output.nextAction}`;
}

export async function runSupportTriage(
  input: unknown,
  options: OrchestratorOptions = {}
): Promise<TriageOutput> {
  const traceId = randomUUID();
  const logger = new Logger(Boolean(options.verbose));
  const maxRetries = options.maxRetries ?? 2;
  const baseBackoffMs = options.baseBackoffMs ?? 40;
  const kbTool = options.deps?.knowledgeBaseSearch ?? knowledgeBaseSearch;
  const riskTool = options.deps?.customerRiskLookup ?? customerRiskLookup;
  const state: RunState = {
    traceId,
    steps: [],
    toolCalls: [],
    rationaleParts: []
  };

  const start = Date.now();
  state.steps.push("input_validation");
  const ticket = ticketSchema.parse(input);
  logger.info({
    traceId,
    step: "input_validation",
    latencyMs: Date.now() - start,
    message: "Ticket schema validation passed.",
    data: redactObject(ticket as unknown as Record<string, unknown>)
  });

  state.steps.push("guardrail_check");
  const refusal = evaluateRefusal(ticket);
  if (refusal.refuse) {
    const refusedBase = {
      ticketId: ticket.ticketId,
      category: "refusal",
      priority: "low",
      rationale: refusal.reason ?? "Request refused by guardrails.",
      nextAction: "Escalate to a human support manager for manual review.",
      responseDraft:
        "I cannot process this request automatically. A support specialist will review your case.",
      toolsUsed: ["knowledgeBaseSearch", "customerRiskLookup"],
      traceId,
      refused: true
    } as const;
    const refusedResult = triageOutputSchema.parse({
      ...refusedBase,
      summary: renderSummary(refusedBase)
    });
    return refusedResult;
  }

  state.steps.push("planner");
  state.rationaleParts.push("Planner selected knowledge and risk tools.");

  const kbStart = Date.now();
  const kbResult = await withRetry(
    async () => kbTool(ticket, { traceId }),
    maxRetries,
    baseBackoffMs
  );
  state.toolCalls.push("knowledgeBaseSearch");
  logger.info({
    traceId,
    step: "tool_knowledgeBaseSearch",
    latencyMs: Date.now() - kbStart,
    message: "Knowledge base lookup complete.",
    data: kbResult as unknown as Record<string, unknown>
  });

  const riskStart = Date.now();
  const riskResult = await withRetry(
    async () => riskTool(ticket.customerId, { traceId }),
    maxRetries,
    baseBackoffMs
  );
  state.toolCalls.push("customerRiskLookup");
  logger.info({
    traceId,
    step: "tool_customerRiskLookup",
    latencyMs: Date.now() - riskStart,
    message: "Customer risk lookup complete.",
    data: riskResult as unknown as Record<string, unknown>
  });

  state.steps.push("decision_synthesis");
  const category = categorySchema.parse(kbResult.categoryHint);
  const priority = prioritySchema.parse(
    computePriority(category, riskResult.riskLevel, riskResult.priorIncidents)
  );
  state.rationaleParts.push(`Matched policy: ${kbResult.matchedPolicy}`);
  state.rationaleParts.push(
    `Risk level ${riskResult.riskLevel}, prior incidents ${riskResult.priorIncidents}.`
  );

  const outputBase = {
    ticketId: ticket.ticketId,
    category,
    priority,
    rationale: state.rationaleParts.join(" "),
    nextAction: kbResult.recommendedAction,
    responseDraft: `Thanks for contacting support. We identified this as ${category} and prioritized it as ${priority}. ${kbResult.recommendedAction}`,
    toolsUsed: state.toolCalls,
    traceId,
    refused: false
  } as const;

  state.steps.push("output_validation");
  const output = triageOutputSchema.parse({
    ...outputBase,
    summary: renderSummary(outputBase)
  });

  if (!output.rationale || !output.nextAction) {
    throw new Error("Deterministic check failed: rationale or nextAction missing.");
  }
  return output;
}

export function parseTicketInput(raw: string): TicketInput {
  const parsed = JSON.parse(raw) as unknown;
  return ticketSchema.parse(parsed);
}
