import { describe, expect, it } from "vitest";
import { runSupportTriage } from "../../src/agent/orchestrator.js";

describe("prioritization logic", () => {
  it("marks security incident with high risk as critical", async () => {
    const result = await runSupportTriage({
      ticketId: "t-sec-1",
      customerId: "cst_demo_03",
      channel: "email",
      subject: "My account was hacked",
      message: "I think someone hacked my account and changed data.",
      createdAt: "2026-05-04T10:00:00.000Z"
    });

    expect(result.category).toBe("security_incident");
    expect(result.priority).toBe("critical");
  });
});
