package mock

import (
	"context"
	"fmt"
	"strings"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
)

// MockPlanner enriches preallocated plan blocks with deterministic copy for development.
type MockPlanner struct{}

func New() *MockPlanner {
	return &MockPlanner{}
}

func (p *MockPlanner) GenerateDailyPlan(_ context.Context, req *ai.PlanRequest) (*ai.PlanResult, error) {
	blocks := make([]ai.CandidateBlock, 0, len(req.CandidateBlocks))
	for _, block := range req.CandidateBlocks {
		enriched := block
		if strings.TrimSpace(enriched.Description) == "" {
			enriched.Description = defaultDescription(block)
		}
		if strings.TrimSpace(enriched.Goal) == "" {
			enriched.Goal = defaultGoal(block)
		}
		if strings.TrimSpace(enriched.ExpectedOutput) == "" {
			enriched.ExpectedOutput = defaultOutput(block)
		}
		if strings.TrimSpace(enriched.Note) == "" {
			enriched.Note = defaultNote(block)
		}
		blocks = append(blocks, enriched)
	}

	return &ai.PlanResult{
		Summary:    fmt.Sprintf("[Mock] Generated next-day plan for %s with %d blocks.", req.Date.Format("2006-01-02"), len(blocks)),
		TimeBlocks: blocks,
	}, nil
}

func defaultDescription(block ai.CandidateBlock) string {
	switch block.SourceType {
	case domain.PlanBlockSourceSchedule, domain.PlanBlockSourceHabit, domain.PlanBlockSourceAnchor:
		return "Locked time reserved by your planning constraints."
	case domain.PlanBlockSourceTask:
		return "Focused work session allocated from pending tasks."
	case domain.PlanBlockSourceContext:
		return "Flexible planning block generated from your recent context."
	default:
		return "Planner-generated time block."
	}
}

func defaultGoal(block ai.CandidateBlock) string {
	switch block.Type {
	case domain.TimeBlockTypeBreak:
		return "Protect recovery time and avoid task spillover."
	case domain.TimeBlockTypePersonal:
		return "Finish the personal routine without conflicting with work blocks."
	case domain.TimeBlockTypeBuffer:
		return "Review the day and prepare the next one."
	default:
		return fmt.Sprintf("Advance %s in a clear, bounded session.", strings.ToLower(block.Title))
	}
}

func defaultOutput(block ai.CandidateBlock) string {
	switch block.Type {
	case domain.TimeBlockTypeBreak, domain.TimeBlockTypePersonal:
		return "Completed reserved routine."
	case domain.TimeBlockTypeBuffer:
		return "Short review notes and updated priorities."
	default:
		return fmt.Sprintf("A concrete result for %s.", strings.ToLower(block.Title))
	}
}

func defaultNote(block ai.CandidateBlock) string {
	if block.IsLocked {
		return "Protected by planner rules."
	}
	return "Placed into an available window after hard constraints."
}
