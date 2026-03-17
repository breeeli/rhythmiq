package ai

import (
	"context"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
)

// PlanRequest carries all context needed to generate a daily plan.
type PlanRequest struct {
	User            *domain.User
	Tasks           []*domain.Task
	Date            time.Time
	ContextText     string
	AnchoredItems   []AnchoredItem
	CandidateBlocks []CandidateBlock
}

// PlanResult is the structured output from the AI planner.
type PlanResult struct {
	Summary    string
	TimeBlocks []CandidateBlock
}

type AnchoredItem struct {
	Title     string
	StartTime string
	EndTime   string
	Note      string
}

// CandidateBlock represents a pre-allocated plan block that can be enriched by the planner.
type CandidateBlock struct {
	TaskID         *uint
	Type           domain.TimeBlockType
	Title          string
	StartTime      string
	EndTime        string
	Note           string
	Description    string
	Goal           string
	ExpectedOutput string
	SourceType     domain.PlanBlockSourceType
	IsLocked       bool
}

// Planner is the interface for any AI planning backend.
// Implement this interface to swap providers (mock → OpenAI → DeepSeek).
type Planner interface {
	GenerateDailyPlan(ctx context.Context, req *PlanRequest) (*PlanResult, error)
}
