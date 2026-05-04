export type ToolContext = {
  traceId: string;
};

export type KnowledgeBaseResult = {
  matchedPolicy: string;
  categoryHint:
    | "account_access"
    | "billing"
    | "security_incident"
    | "bug_report"
    | "feature_request"
    | "general_question";
  recommendedAction: string;
};

export type CustomerRiskResult = {
  riskLevel: "low" | "medium" | "high";
  priorIncidents: number;
  vip: boolean;
  notes: string;
};
