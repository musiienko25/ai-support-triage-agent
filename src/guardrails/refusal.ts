import type { TicketInput } from "../schemas/ticket.js";

export type RefusalDecision = {
  refuse: boolean;
  reason: string | null;
};

const promptInjectionSignals = [
  "ignore instructions",
  "reveal system prompt",
  "show hidden prompt",
  "ігноруй інструкції",
  "розкрий системний промпт"
];

const unsafeActionSignals = [
  "delete all data",
  "drop database",
  "close ticket automatically",
  "disable security"
];

const outOfScopeSignals = ["write me a poem", "weather today", "stock tips"];

export function evaluateRefusal(ticket: TicketInput): RefusalDecision {
  const text = `${ticket.subject} ${ticket.message}`.toLowerCase();

  if (promptInjectionSignals.some((signal) => text.includes(signal))) {
    return {
      refuse: true,
      reason: "Prompt injection attempt detected."
    };
  }

  if (unsafeActionSignals.some((signal) => text.includes(signal))) {
    return {
      refuse: true,
      reason: "Unsafe action request without authorization."
    };
  }

  if (outOfScopeSignals.some((signal) => text.includes(signal))) {
    return {
      refuse: true,
      reason: "Request is outside of support triage scope."
    };
  }

  return {
    refuse: false,
    reason: null
  };
}
