package service

import "testing"

func TestNormalizeDays(t *testing.T) {
	t.Parallel()

	result := normalizeDays([]string{" Mon ", "tue", "wed", "wed", "oops"})
	if len(result) != 3 {
		t.Fatalf("expected 3 normalized days, got %v", result)
	}
	if result[0] != "mon" || result[1] != "tue" || result[2] != "wed" {
		t.Fatalf("unexpected normalized days: %v", result)
	}
}

func TestValidateHabitRule(t *testing.T) {
	t.Parallel()

	err := validateHabitRule(UpsertHabitRuleRequest{
		Title:           "Workout",
		DurationMinutes: 20,
		Days:            []string{"mon"},
		PreferredStart:  "21:00",
	})
	if err != nil {
		t.Fatalf("expected valid habit rule, got %v", err)
	}
}
