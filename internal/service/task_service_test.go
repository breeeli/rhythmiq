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

type stubTaskDecomposer struct {
	suggestions []ai.SubtaskSuggestion
}

func (s *stubTaskDecomposer) DecomposeTask(_ context.Context, _ *ai.TaskDecompositionRequest) (*ai.TaskDecompositionResult, error) {
	return &ai.TaskDecompositionResult{Subtasks: s.suggestions}, nil
}

func TestTaskServiceDecomposeReplacesOnlyGeneratedSubtasks(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlitedriver.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.Task{}, &domain.Subtask{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	taskRepo := sqlite.NewTaskRepo(db)
	subtaskRepo := sqlite.NewSubtaskRepo(db)
	svc := NewTaskService(taskRepo, subtaskRepo, &stubTaskDecomposer{
		suggestions: []ai.SubtaskSuggestion{
			{Title: "拆解步骤一", EstimatedMinutes: 20, PreferWindow: "morning"},
			{Title: "拆解步骤二", EstimatedMinutes: 30, PreferWindow: "afternoon"},
		},
	})

	ctx := context.Background()
	task := &domain.Task{
		UserID:           1,
		Title:            "准备演示",
		Priority:         domain.TaskPriorityHigh,
		EstimatedMinutes: 90,
		Status:           domain.TaskStatusTodo,
	}
	if err := taskRepo.Create(ctx, task); err != nil {
		t.Fatalf("create task: %v", err)
	}

	if err := subtaskRepo.Create(ctx, &domain.Subtask{
		TaskID:         task.ID,
		Title:          "手动子任务",
		Sequence:       1,
		LLMGenerated:   false,
		Status:         domain.SubtaskStatusTodo,
		Priority:       domain.TaskPriorityHigh,
		EstimatedMinutes: 15,
	}); err != nil {
		t.Fatalf("create manual subtask: %v", err)
	}
	if err := subtaskRepo.Create(ctx, &domain.Subtask{
		TaskID:           task.ID,
		Title:            "旧的智能子任务",
		Sequence:         2,
		LLMGenerated:     true,
		Status:           domain.SubtaskStatusTodo,
		Priority:         domain.TaskPriorityHigh,
		EstimatedMinutes: 15,
	}); err != nil {
		t.Fatalf("create generated subtask: %v", err)
	}

	updated, err := svc.Decompose(ctx, task.ID)
	if err != nil {
		t.Fatalf("decompose task: %v", err)
	}

	if len(updated.Subtasks) != 3 {
		t.Fatalf("expected 3 subtasks after decomposition, got %d", len(updated.Subtasks))
	}
	if updated.Subtasks[0].Title != "手动子任务" {
		t.Fatalf("expected manual subtask to be preserved first, got %+v", updated.Subtasks[0])
	}
	if updated.Subtasks[1].Title != "拆解步骤一" || !updated.Subtasks[1].LLMGenerated {
		t.Fatalf("expected first generated subtask, got %+v", updated.Subtasks[1])
	}
	if updated.Subtasks[2].Title != "拆解步骤二" || !updated.Subtasks[2].LLMGenerated {
		t.Fatalf("expected second generated subtask, got %+v", updated.Subtasks[2])
	}
}
