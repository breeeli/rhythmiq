## 1. Data Model And Persistence

- [x] 1.1 Add domain models and storage for fixed schedule rules and repeating habit rules with validation-friendly fields.
- [x] 1.2 Extend plan/time-block models and repositories to persist structured planning details such as description, goal, expected output, source type, and lock status.
- [x] 1.3 Add backend handlers and API contracts to create, update, and fetch planning constraints for the current user.

## 2. Rule-Based Next-Day Planning

- [x] 2.1 Replace the current direct daily-plan generation flow with a target-date next-day planning request that accepts structured context and anchored items.
- [x] 2.2 Implement hard-constraint resolution and conflict detection for schedule rules, habit rules, and request-scoped anchored items.
- [x] 2.3 Implement a deterministic rule scheduler that reserves hard constraints first and allocates flexible planning windows only in remaining valid time slots.

## 3. LLM Enrichment And Error Handling

- [x] 3.1 Update the planner interface and planner implementations so the LLM/mock layer enriches preallocated blocks with summary, explanation, goal, and expected output instead of deciding time placement.
- [x] 3.2 Add service-level guards that reject invalid time edits from the planner layer and prevent partial persistence on generation failure.
- [x] 3.3 Add actionable API errors for validation failures, unsatisfied constraints, and planner enrichment failures.

## 4. Frontend Next-Day Planner Experience

- [x] 4.1 Update frontend types, API clients, and stores to support planning-constraint CRUD and structured next-day plan generation.
- [x] 4.2 Rework the planning page into a next-day planner flow with fixed schedule setup, repeating habit setup, context input, and generate action.
- [x] 4.3 Update the plan result UI to display each block's time range, type, explanation, goal, expected output, and relevant empty/error states.

## 5. Verification

- [x] 5.1 Add backend tests for constraint validation, conflict detection, and rule scheduling behavior.
- [ ] 5.2 Add frontend state or component tests for planner form submission, error handling, and plan rendering.
- [ ] 5.3 Run the project's backend and frontend test/lint flows and verify the next-day planner MVP acceptance criteria manually.
