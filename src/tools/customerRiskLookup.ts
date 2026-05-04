import type { CustomerRiskResult, ToolContext } from "./types.js";

const riskStore: Record<string, CustomerRiskResult> = {
  cst_demo_01: {
    riskLevel: "low",
    priorIncidents: 0,
    vip: false,
    notes: "No prior incidents."
  },
  cst_demo_02: {
    riskLevel: "medium",
    priorIncidents: 2,
    vip: true,
    notes: "VIP customer, two recent billing escalations."
  },
  cst_demo_03: {
    riskLevel: "high",
    priorIncidents: 5,
    vip: false,
    notes: "Multiple security-related incidents in past 90 days."
  }
};

export async function customerRiskLookup(
  customerId: string,
  _ctx: ToolContext
): Promise<CustomerRiskResult> {
  return (
    riskStore[customerId] ?? {
      riskLevel: "low",
      priorIncidents: 0,
      vip: false,
      notes: "Customer profile not found in mock store."
    }
  );
}
