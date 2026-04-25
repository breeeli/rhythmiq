package service

import (
	"context"
	"fmt"
	"testing"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository/sqlite"
	sqlitedriver "gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestTaskServiceCreatesOrderedExecutableItems(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlitedriver.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.Goal{}, &domain.Task{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	taskRepo := sqlite.NewTaskRepo(db)
	svc := NewTaskService(taskRepo)
	ctx := context.Background()
	goalID := uint(1)

	if _, err := svc.Create(ctx, 1, CreateTaskRequest{
		GoalID:           &goalID,
		Title:            "第二步",
		ExpectedOutput:   "后做的产出",
		EstimatedMinutes: 30,
		Sequence:         2,
	}); err != nil {
		t.Fatalf("create second task: %v", err)
	}
	if _, err := svc.Create(ctx, 1, CreateTaskRequest{
		GoalID:           &goalID,
		Title:            "第一步",
		ExpectedOutput:   "先做的产出",
		EstimatedMinutes: 30,
		Sequence:         1,
	}); err != nil {
		t.Fatalf("create first task: %v", err)
	}

	tasks, err := taskRepo.FindByGoalID(ctx, goalID)
	if err != nil {
		t.Fatalf("find tasks: %v", err)
	}
	if len(tasks) != 2 {
		t.Fatalf("expected 2 tasks, got %d", len(tasks))
	}
	if tasks[0].Title != "第一步" || tasks[0].ExpectedOutput != "先做的产出" {
		t.Fatalf("expected ordered first task with output, got %+v", tasks[0])
	}
	if tasks[1].Title != "第二步" {
		t.Fatalf("expected second task second, got %+v", tasks[1])
	}
}

func TestTaskServiceRejectsEmptyTitle(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlitedriver.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.Task{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	svc := NewTaskService(sqlite.NewTaskRepo(db))
	_, err = svc.Create(context.Background(), 1, CreateTaskRequest{Title: " "})
	if err == nil || !IsValidationError(err) {
		t.Fatalf("expected validation error, got %v", err)
	}
}
