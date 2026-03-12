package mock

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
)

// MockPlanner generates a simple deterministic daily plan for development.
// It distributes pending tasks into work blocks after the user's wake-up time.
type MockPlanner struct{}

func New() *MockPlanner {
	return &MockPlanner{}
}

func (p *MockPlanner) GenerateDailyPlan(_ context.Context, req *ai.PlanRequest) (*ai.PlanResult, error) {
	blocks := []ai.BlockSuggestion{
		{
			Type:      domain.TimeBlockTypePersonal,
			Title:     "Morning routine",
			StartTime: req.User.WakeUpTime,
			EndTime:   addMinutes(req.User.WakeUpTime, 30),
			Note:      "Breakfast, exercise, planning",
		},
	}

	// Schedule focus tasks in the user's preferred focus window
	cursor := req.User.FocusStart
	for _, task := range req.Tasks {
		if task.Status == domain.TaskStatusDone || task.Status == domain.TaskStatusSkipped {
			continue
		}
		taskID := task.ID
		endTime := addMinutes(cursor, task.EstimatedMinutes)
		blocks = append(blocks, ai.BlockSuggestion{
			TaskID:    &taskID,
			Type:      domain.TimeBlockTypeWork,
			Title:     task.Title,
			StartTime: cursor,
			EndTime:   endTime,
			Note:      fmt.Sprintf("Estimated %d min", task.EstimatedMinutes),
		})

		// 10-min buffer between tasks
		cursor = addMinutes(endTime, 10)
	}

	blocks = append(blocks, ai.BlockSuggestion{
		Type:      domain.TimeBlockTypeBreak,
		Title:     "Lunch break",
		StartTime: "12:00",
		EndTime:   "13:00",
	})

	blocks = append(blocks, ai.BlockSuggestion{
		Type:      domain.TimeBlockTypeBuffer,
		Title:     "Evening review",
		StartTime: "21:00",
		EndTime:   "21:30",
		Note:      "Reflect on the day, adjust tomorrow's plan",
	})

	return &ai.PlanResult{
		Summary:    fmt.Sprintf("[Mock] Generated plan for %s with %d tasks.", req.Date.Format("2006-01-02"), len(req.Tasks)),
		TimeBlocks: blocks,
	}, nil
}

// addMinutes adds n minutes to a HH:MM string and returns a new HH:MM string.
func addMinutes(hhmm string, n int) string {
	var h, m int
	fmt.Sscanf(hhmm, "%d:%02d", &h, &m)
	total := h*60 + m + n
	return fmt.Sprintf("%02d:%02d", (total/60)%24, total%60)
}
