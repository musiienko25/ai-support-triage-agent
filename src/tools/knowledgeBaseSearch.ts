import type { TicketInput } from "../schemas/ticket.js";
import type { KnowledgeBaseResult, ToolContext } from "./types.js";

const policyRecords = [
  {
    keyword: "password",
    matchedPolicy: "KB-ACC-001 Password reset and login recovery",
    categoryHint: "account_access",
    recommendedAction: "Request identity verification and send reset flow."
  },
  {
    keyword: "charged",
    matchedPolicy: "KB-BIL-003 Unexpected charge handling",
    categoryHint: "billing",
    recommendedAction: "Collect invoice id and open billing adjustment review."
  },
  {
    keyword: "hacked",
    matchedPolicy: "KB-SEC-002 Account compromise response",
    categoryHint: "security_incident",
    recommendedAction: "Force logout sessions and start security verification."
  },
  {
    keyword: "bug",
    matchedPolicy: "KB-ENG-004 Product bug intake",
    categoryHint: "bug_report",
    recommendedAction: "Collect repro steps and route ticket to engineering."
  }
] as const;

export async function knowledgeBaseSearch(
  ticket: TicketInput,
  _ctx: ToolContext
): Promise<KnowledgeBaseResult> {
  const text = `${ticket.subject} ${ticket.message}`.toLowerCase();
  const matched = policyRecords.find((record) => text.includes(record.keyword));

  if (matched) {
    return {
      matchedPolicy: matched.matchedPolicy,
      categoryHint: matched.categoryHint,
      recommendedAction: matched.recommendedAction
    };
  }

  return {
    matchedPolicy: "KB-GEN-000 General support triage",
    categoryHint: "general_question",
    recommendedAction: "Gather additional context and route to support queue."
  };
}
