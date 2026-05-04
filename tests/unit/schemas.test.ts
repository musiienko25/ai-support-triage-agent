import { describe, expect, it } from "vitest";
import { triageOutputSchema } from "../../src/schemas/output.js";
import { ticketSchema } from "../../src/schemas/ticket.js";

describe("schemas", () => {
  it("validates correct ticket payload", () => {
    const result = ticketSchema.safeParse({
      ticketId: "t-100",
      customerId: "cst_demo_01",
      channel: "email",
      subject: "Password reset needed",
      message: "I cannot access my account after changing device.",
      createdAt: "2026-05-04T10:00:00.000Z"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid output enum values", () => {
    const result = triageOutputSchema.safeParse({
      ticketId: "t-100",
      category: "unknown",
      priority: "urgent",
      rationale: "Some reason that is long enough.",
      nextAction: "Take next action now.",
      responseDraft: "Draft response to customer.",
      toolsUsed: ["knowledgeBaseSearch", "customerRiskLookup"],
      traceId: "trace-12345678",
      summary: "Short summary with enough length.",
      refused: false
    });
    expect(result.success).toBe(false);
  });
});
