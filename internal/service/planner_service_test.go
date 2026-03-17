package service

import (
	"errors"
	"testing"

	"github.com/breeeli/rhythmiq/internal/domain"
)

func TestValidateClockRange(t *testing.T) {
	t.Parallel()

	if err := validateClockRange("09:00", "10:00"); err != nil {
		t.Fatalf("expected valid range, got %v", err)
	}

	if err := validateClockRange("10:00", "09:00"); err == nil {
		t.Fatal("expected invalid range error")
	}
}

func TestDetectOverlap(t *testing.T) {
	t.Parallel()

	err := detectOverlap([]scheduleBlock{
		{Title: "work", Start: 9 * 60, End: 10 * 60},
		{Title: "meeting", Start: 9*60 + 30, End: 11 * 60},
	})
	if !errors.Is(err, ErrConstraintConflict) {
		t.Fatalf("expected conflict error, got %v", err)
	}
}

func TestScheduleFlexibleBlocksPrefersAvailableWindow(t *testing.T) {
	t.Parallel()

	items := []planningItem{
		{
			Title:         "Write doc",
			EstimatedMins: 60,
			PreferWindow:  "morning",
			SourceType:    domain.PlanBlockSourceTask,
		},
	}
	windows := [][2]int{{8 * 60, 10 * 60}, {14 * 60, 18 * 60}}

	blocks := scheduleFlexibleBlocks(items, windows)
	if len(blocks) != 1 {
		t.Fatalf("expected 1 block, got %d", len(blocks))
	}
	if blocks[0].Start != 8*60 || blocks[0].End != 9*60 {
		t.Fatalf("unexpected block placement: %+v", blocks[0])
	}
}

func TestPlaceHabitBlockReturnsConflictWhenNoSlot(t *testing.T) {
	t.Parallel()

	_, err := placeHabitBlock(&domain.HabitRule{
		Title:           "Workout",
		DurationMinutes: 60,
		PreferredStart:  "20:00",
		Required:        true,
	}, []scheduleBlock{
		{Title: "Blocked", Start: 20 * 60, End: 21 * 60},
	})

	if !errors.Is(err, ErrConstraintConflict) {
		t.Fatalf("expected conflict error, got %v", err)
	}
}
