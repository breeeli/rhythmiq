package service

import (
	"context"
	"fmt"
	"testing"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository/sqlite"
	sqlitedriver "gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type stubGoalGenerator struct {
	result *ai.GoalGenerationResult
}

func (s *stubGoalGenerator) GenerateGoal(_ context.Context, _ *ai.GoalGenerationRequest) (*ai.GoalGenerationResult, error) {
	return s.result, nil
}

func TestGoalServiceGenerateCreatesGoalAndTasks(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlitedriver.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.Goal{}, &domain.Task{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	goalRepo := sqlite.NewGoalRepo(db)
	taskRepo := sqlite.NewTaskRepo(db)
	svc := NewGoalService(goalRepo, taskRepo, &stubGoalGenerator{
		result: &ai.GoalGenerationResult{
			Goal: ai.GoalSuggestion{
				Title:       "建立健康节奏",
				Description: "自动生成的健康目标。",
				Type:        domain.GoalTypeShortTerm,
				Priority:    domain.GoalPriorityHigh,
				Tasks: []ai.TaskOutline{
					{Title: "第一个步骤", EstimatedMinutes: 30, Priority: domain.TaskPriorityHigh},
					{Title: "第二个步骤", EstimatedMinutes: 45, Priority: domain.TaskPriorityMedium},
				},
			},
		},
	})

	goal, err := svc.Generate(context.Background(), 1, GenerateGoalRequest{
		Prompt: "我想改善健康",
	})
	if err != nil {
		t.Fatalf("generate goal: %v", err)
	}
	if goal.Title != "建立健康节奏" {
		t.Fatalf("unexpected goal title: %s", goal.Title)
	}
	if len(goal.Tasks) != 2 {
		t.Fatalf("expected 2 generated tasks, got %d", len(goal.Tasks))
	}
}
