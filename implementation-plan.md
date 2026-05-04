# Support Triage Agent: Detailed Execution Plan

## Goal
Implement a local demo-grade support triage agent in TypeScript/Node.js that performs deterministic multi-step processing and returns:
- strict JSON output (schema-validated),
- human-readable summary,
- evidence of tool usage and decision rationale.

## Scope
### In scope
- Ticket intake and validation.
- Ticket classification and prioritization (`low`, `medium`, `high`, `critical`).
- Recommended next action and customer response draft.
- Structured orchestration logs with trace metadata.
- Unit and E2E tests for pipeline correctness.

### Out of scope
- Sending real emails/messages to customers.
- Live CRM/helpdesk integration.
- Fully autonomous ticket closure without human review.

## Technical Decisions
- Runtime: Node.js 20+
- Language: TypeScript (strict mode)
- Validation: `zod`
- Test framework: `vitest`
- Module system: ESM (`type: module`)

## Deliverables and Acceptance Criteria
### D1. Schemas
Tasks:
- Define input ticket schema.
- Define final output schema and enums.

Acceptance:
- Invalid ticket payloads fail with explicit schema errors.
- Invalid output shape is rejected before returning results.

### D2. Multi-step orchestrator
Tasks:
- Implement ordered steps:
  1) input validation
  2) planner
  3) tool execution (minimum 2 tools)
  4) decision synthesis
  5) output validation
  6) summary rendering
- Persist execution state with step results and reasoning.

Acceptance:
- Orchestrator returns deterministic output for the same input.
- E2E confirms both required tools are called.

### D3. Tools and guardrails
Tasks:
- Implement `knowledgeBaseSearch` using local mock policy data.
- Implement `customerRiskLookup` using local mock customer profiles.
- Add refusal checks:
  - out-of-scope requests,
  - prompt injection attempts,
  - unsafe direct-action requests.

Acceptance:
- Refusal path returns safe output and refusal rationale.
- Tool failures are retried with bounded backoff.

### D4. Observability
Tasks:
- Add structured logger with `traceId`, step, and latency.
- Log tool input/output in safe, redacted form.
- Add `--verbose` mode in CLI.

Acceptance:
- Logs are available for each orchestration step.
- Verbose mode shows decision timeline.

### D5. Tests and fixtures
Tasks:
- Unit tests for schemas, guardrails, priority logic, retry behavior.
- E2E pipeline test from sample ticket to valid final output.
- Add sample input and expected output fixtures.

Acceptance:
- `npm test` passes.
- `npm run test:e2e` passes.

### D6. Documentation
Tasks:
- Add README with:
  - problem statement,
  - scope/non-scope,
  - architecture/data flow,
  - setup and run commands,
  - test steps,
  - example input/output,
  - trade-offs and productionization notes.

Acceptance:
- README enables local run in 3-4 commands.
- Required "Not in production today" wording is included.

## Implementation Order (Milestones)
- M1: Project bootstrap (`package.json`, `tsconfig`, test config).
- M2: Input/output schemas and mock tools.
- M3: Orchestrator + guardrails + retry.
- M4: Logger + CLI verbose mode.
- M5: Unit/E2E tests + fixtures.
- M6: README finalization and DoD verification.
