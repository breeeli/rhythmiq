## ADDED Requirements

### Requirement: User can submit next-day planning context
The system SHALL allow the user to submit a target date and planning context for next-day generation. The planning context MUST support free-text background plus structured anchored items that already have fixed times.

#### Scenario: Submit next-day context with anchored meeting
- **WHEN** the user requests a plan for `2026-03-18` with context text and an anchored item from `15:00` to `16:00`
- **THEN** the system accepts the request and includes both the context text and anchored item in the planning pipeline

#### Scenario: Reject invalid anchored item
- **WHEN** the user submits an anchored item whose end time is not later than its start time
- **THEN** the system rejects the planning request with a validation error

### Requirement: System generates a next-day plan without violating hard constraints
The system SHALL generate a next-day plan only within time windows that remain after applying hard constraints and anchored items. The generated plan MUST NOT place flexible work blocks into reserved schedule, commute, rest, or habit time.

#### Scenario: Flexible block avoids a fixed workday constraint
- **WHEN** the user has a locked schedule rule covering `09:20` to `18:00` except a lunch gap and requests a next-day plan
- **THEN** the system only places flexible work blocks into the remaining available windows outside the reserved ranges

#### Scenario: Required habit remains reserved
- **WHEN** the user has an evening workout habit resolved as a hard constraint for the target date
- **THEN** the generated plan preserves that reserved time and does not replace it with another task block

### Requirement: Generated plan blocks include explanation, goal, and expected output
The system SHALL persist and return structured plan blocks that include a title, time range, explanation, goal, and expected output for each scheduled segment shown to the user.

#### Scenario: Return enriched work block details
- **WHEN** the system generates a work block for drafting a rule scheduling document
- **THEN** the returned block includes a human-readable explanation, a concrete goal, and an expected output summary

#### Scenario: Return enriched learning block details
- **WHEN** the system generates a learning block for reading a chapter
- **THEN** the returned block includes the learning objective and the expected study output

### Requirement: User can view the generated next-day plan in the product UI
The system SHALL provide a page or screen where the user can review the generated next-day plan, including each block's time range, type, explanation, goal, and expected output.

#### Scenario: Render generated plan blocks
- **WHEN** the user opens the next-day planner after a successful generation
- **THEN** the UI displays the generated summary and a list of plan blocks with their structured fields

#### Scenario: Render empty state before generation
- **WHEN** no next-day plan exists for the selected target date
- **THEN** the UI shows a clear empty state with an action to generate the plan

### Requirement: System provides actionable generation errors
The system SHALL return actionable errors for validation failures, constraint conflicts, and planner generation failures, and MUST NOT persist a partial next-day plan when generation fails.

#### Scenario: Fail cleanly on unsatisfied constraints
- **WHEN** the planning request cannot be scheduled because the hard constraints leave no valid windows
- **THEN** the system returns an error explaining that no schedulable time remains and saves no new plan

#### Scenario: Fail cleanly on planner enrichment error
- **WHEN** the LLM or planner enrichment step fails after the rule scheduler prepares candidate blocks
- **THEN** the system returns a generation failure error and does not persist a partial plan result
