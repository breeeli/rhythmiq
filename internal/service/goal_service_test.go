package service

import (
	"context"
	"fmt"
	"testing"
	"time"

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

func TestGoalServiceCreatePersistsManualGoalFields(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlitedriver.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.Goal{}, &domain.Task{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	svc := NewGoalService(sqlite.NewGoalRepo(db), sqlite.NewTaskRepo(db), nil)
	target := mustDate(t, "2026-05-01")
	review := mustDate(t, "2026-04-28")

	goal, err := svc.Create(context.Background(), 1, CreateGoalRequest{
		Title:           "完成 Rhythmiq MVP",
		Status:          domain.GoalStatusDraft,
		Priority:        domain.GoalPriorityHigh,
		TargetDate:      &target,
		ReviewDate:      &review,
		Outcome:         "目标和行动项可以本地 CRUD。",
		SuccessCriteria: []string{"可以创建目标", "可以维护行动项", "  "},
		Motivation:      "先跑通核心领域模型。",
		Progress:        25,
	})
	if err != nil {
		t.Fatalf("create goal: %v", err)
	}

	found, err := svc.GetByID(context.Background(), goal.ID)
	if err != nil {
		t.Fatalf("find goal: %v", err)
	}
	if found.Status != domain.GoalStatusDraft {
		t.Fatalf("expected draft status, got %s", found.Status)
	}
	if found.Source != domain.GoalSourceManual {
		t.Fatalf("expected manual source, got %s", found.Source)
	}
	if found.Priority != domain.GoalPriorityHigh {
		t.Fatalf("expected high priority, got %s", found.Priority)
	}
	if found.TargetDate == nil || !sameDay(*found.TargetDate, target) {
		t.Fatalf("expected target date %v, got %v", target, found.TargetDate)
	}
	if found.ReviewDate == nil || !sameDay(*found.ReviewDate, review) {
		t.Fatalf("expected review date %v, got %v", review, found.ReviewDate)
	}
	if found.Outcome == "" || found.Motivation == "" {
		t.Fatalf("expected outcome and motivation to persist: %+v", found)
	}
	if len(found.SuccessCriteria) != 2 {
		t.Fatalf("expected blank criteria to be removed, got %+v", found.SuccessCriteria)
	}
	if found.Progress != 25 {
		t.Fatalf("expected progress 25, got %d", found.Progress)
	}
}

func TestGoalServiceRejectsInvalidStatus(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlitedriver.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.Goal{}, &domain.Task{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	svc := NewGoalService(sqlite.NewGoalRepo(db), sqlite.NewTaskRepo(db), nil)
	_, err = svc.Create(context.Background(), 1, CreateGoalRequest{
		Title:  "坏状态",
		Status: domain.GoalStatus("unknown"),
	})
	if err == nil || !IsValidationError(err) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestGoalServiceSupportsChildGoals(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlitedriver.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.Goal{}, &domain.Task{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	svc := NewGoalService(sqlite.NewGoalRepo(db), sqlite.NewTaskRepo(db), nil)
	ctx := context.Background()

	parent, err := svc.Create(ctx, 1, CreateGoalRequest{Title: "父目标"})
	if err != nil {
		t.Fatalf("create parent: %v", err)
	}
	child, err := svc.Create(ctx, 1, CreateGoalRequest{Title: "子目标", ParentGoalID: &parent.ID})
	if err != nil {
		t.Fatalf("create child: %v", err)
	}
	if child.ParentGoalID == nil || *child.ParentGoalID != parent.ID {
		t.Fatalf("expected child parent id %d, got %+v", parent.ID, child.ParentGoalID)
	}

	found, err := svc.GetByID(ctx, parent.ID)
	if err != nil {
		t.Fatalf("find parent: %v", err)
	}
	if len(found.ChildGoals) != 1 || found.ChildGoals[0].ID != child.ID {
		t.Fatalf("expected parent to preload child goal, got %+v", found.ChildGoals)
	}
}

func TestGoalServiceDeleteRemovesLinkedTasks(t *testing.T) {
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
	svc := NewGoalService(goalRepo, taskRepo, nil)
	ctx := context.Background()

	goal, err := svc.Create(ctx, 1, CreateGoalRequest{Title: "可删除目标"})
	if err != nil {
		t.Fatalf("create goal: %v", err)
	}
	if err := taskRepo.Create(ctx, &domain.Task{
		UserID: 1,
		GoalID: &goal.ID,
		Title:  "关联行动项",
		Status: domain.TaskStatusTodo,
	}); err != nil {
		t.Fatalf("create task: %v", err)
	}

	if err := svc.Delete(ctx, goal.ID); err != nil {
		t.Fatalf("delete goal: %v", err)
	}
	tasks, err := taskRepo.FindByGoalID(ctx, goal.ID)
	if err != nil {
		t.Fatalf("find tasks: %v", err)
	}
	if len(tasks) != 0 {
		t.Fatalf("expected linked tasks to be deleted, got %d", len(tasks))
	}
}

func mustDate(t *testing.T, value string) time.Time {
	t.Helper()
	parsed, err := time.Parse("2006-01-02", value)
	if err != nil {
		t.Fatalf("parse date: %v", err)
	}
	return parsed
}

func sameDay(left, right time.Time) bool {
	ly, lm, ld := left.Date()
	ry, rm, rd := right.Date()
	return ly == ry && lm == rm && ld == rd
}
