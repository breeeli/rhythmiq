package ai

import (
	"context"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
)

// PlanRequest carries all context needed to generate a daily plan.
type PlanRequest struct {
	User      *domain.User
	Tasks     []*domain.Task // pending tasks to schedule
	Date      time.Time
	ExtraHint string // optional user instruction, e.g. "I have a dentist at 15:00"
}

// PlanResult is the structured output from the AI planner.
type PlanResult struct {
	Summary    string
	TimeBlocks []BlockSuggestion
}

// BlockSuggestion represents a single suggested time block.
type BlockSuggestion struct {
	TaskID    *uint
	Type      domain.TimeBlockType
	Title     string
	StartTime string // HH:MM
	EndTime   string // HH:MM
	Note      string
}

// Planner is the interface for any AI planning backend.
// Implement this interface to swap providers (mock → OpenAI → DeepSeek).
type Planner interface {
	GenerateDailyPlan(ctx context.Context, req *PlanRequest) (*PlanResult, error)
}
