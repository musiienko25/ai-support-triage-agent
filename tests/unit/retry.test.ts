import { describe, expect, it, vi } from "vitest";
import { runSupportTriage } from "../../src/agent/orchestrator.js";

describe("retry behavior", () => {
  it("retries temporary tool failures and succeeds", async () => {
    let attempts = 0;
    const failingKbTool = vi.fn(async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error("Temporary failure");
      }
      return {
        matchedPolicy: "KB-ACC-001 Password reset and login recovery",
        categoryHint: "account_access" as const,
        recommendedAction: "Request identity verification and send reset flow."
      };
    });

    const result = await runSupportTriage(
      {
        ticketId: "t-retry-1",
        customerId: "cst_demo_01",
        channel: "email",
        subject: "Password issue",
        message: "I forgot my password and need access.",
        createdAt: "2026-05-04T10:00:00.000Z"
      },
      {
        maxRetries: 2,
        baseBackoffMs: 1,
        deps: {
          knowledgeBaseSearch: failingKbTool
        }
      }
    );

    expect(failingKbTool).toHaveBeenCalledTimes(2);
    expect(result.category).toBe("account_access");
  });
});
