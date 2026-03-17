## ADDED Requirements

### Requirement: User can manage fixed schedule rules
The system SHALL allow the user to create, update, list, and persist fixed schedule rules for next-day planning. Each rule MUST include a title, a start time, an end time, an applicability pattern, and a lock indicator that marks the time range as unavailable for normal planning.

#### Scenario: Save a weekday schedule rule
- **WHEN** the user saves a fixed schedule rule for weekdays from `09:20` to `18:00`
- **THEN** the system stores the rule and returns it in subsequent planning-constraint reads

#### Scenario: Reject an invalid fixed schedule range
- **WHEN** the user submits a fixed schedule rule whose end time is not later than its start time
- **THEN** the system rejects the request with a validation error and does not persist the rule

### Requirement: User can manage repeating habit rules
The system SHALL allow the user to create, update, list, and persist repeating habit rules for next-day planning. Each habit rule MUST include a title, a duration, an applicability pattern, and a time preference or anchor used during planning.

#### Scenario: Save an evening habit
- **WHEN** the user saves a repeating habit named `Dumbbell workout` with duration `20` minutes for weekdays and an evening preference
- **THEN** the system stores the habit and makes it available to the next-day planning flow

#### Scenario: Reject a habit with invalid duration
- **WHEN** the user submits a repeating habit with a zero or negative duration
- **THEN** the system rejects the request with a validation error and does not persist the habit

### Requirement: Planner resolves hard constraints for a target date
The system SHALL resolve all applicable fixed schedule rules and repeating habit rules into hard constraint blocks for the requested target date before allocating flexible work blocks. Resolved hard constraint blocks MUST reserve time that cannot be assigned to ordinary planning items.

#### Scenario: Resolve weekday constraints for tomorrow
- **WHEN** the user generates a plan for a weekday target date
- **THEN** the system includes all weekday fixed schedule rules and weekday repeating habits as hard constraint blocks in the planning input

#### Scenario: Exclude non-matching recurring rules
- **WHEN** the user generates a plan for a Tuesday and a habit rule only applies on weekends
- **THEN** the system does not include that habit rule in the target date's hard constraint blocks

### Requirement: Planner rejects overlapping hard constraints
The system MUST detect overlapping or contradictory hard constraints before generating a next-day plan and SHALL return an actionable error when the conflict prevents reliable scheduling.

#### Scenario: Detect overlapping locked schedule rules
- **WHEN** two locked schedule rules overlap on the same target date
- **THEN** the system reports a conflict error that identifies the overlapping rules and does not persist a generated plan

#### Scenario: Detect habit collision with locked time
- **WHEN** a required repeating habit can only be placed into a time range already occupied by a locked schedule rule
- **THEN** the system reports that the planning constraints are unsatisfiable and does not generate a plan
