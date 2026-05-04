import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { runSupportTriage } from "../../src/agent/orchestrator.js";
import { triageOutputSchema } from "../../src/schemas/output.js";

describe("support triage e2e", () => {
  it("runs full pipeline and calls at least two tools", async () => {
    const fixturePath = resolve(process.cwd(), "samples/input/password-reset.json");
    const raw = await readFile(fixturePath, "utf-8");
    const ticket = JSON.parse(raw) as unknown;

    const result = await runSupportTriage(ticket);
    const parsed = triageOutputSchema.safeParse(result);

    expect(parsed.success).toBe(true);
    expect(result.toolsUsed).toContain("knowledgeBaseSearch");
    expect(result.toolsUsed).toContain("customerRiskLookup");
    expect(result.toolsUsed.length).toBeGreaterThanOrEqual(2);
    expect(result.summary.length).toBeGreaterThan(10);
  });
});
