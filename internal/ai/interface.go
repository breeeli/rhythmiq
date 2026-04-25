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

type TaskOutline struct {
	Title            string
	Description      string
	Priority         domain.TaskPriority
	EstimatedMinutes int
}

type GoalGenerationRequest struct {
	User        *domain.User
	Prompt      string
	ContextText string
}

type GoalSuggestion struct {
	Title       string
	Description string
	Priority    domain.GoalPriority
	Deadline    *time.Time
	Tasks       []TaskOutline
}

type GoalGenerationResult struct {
	Goal GoalSuggestion
}

type AnchoredItem struct {
	Title     string
	Date      string
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

type GoalGenerator interface {
	GenerateGoal(ctx context.Context, req *GoalGenerationRequest) (*GoalGenerationResult, error)
}
