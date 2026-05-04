import { z } from "zod";

export const prioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const categorySchema = z.enum([
  "account_access",
  "billing",
  "security_incident",
  "bug_report",
  "feature_request",
  "general_question",
  "refusal"
]);

export const triageOutputSchema = z.object({
  ticketId: z.string(),
  category: categorySchema,
  priority: prioritySchema,
  rationale: z.string().min(8),
  nextAction: z.string().min(8),
  responseDraft: z.string().min(8),
  toolsUsed: z.array(z.string()).min(2),
  traceId: z.string().min(8),
  summary: z.string().min(8),
  refused: z.boolean()
});

export type TriageOutput = z.infer<typeof triageOutputSchema>;
