package sqlite

import (
	"context"
	"testing"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestPlanRepoUpdateReplacesTimeBlocks(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&domain.DailyPlan{}, &domain.TimeBlock{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	repo := NewPlanRepo(db)
	ctx := context.Background()
	date := time.Date(2026, 3, 18, 0, 0, 0, 0, time.UTC)

	plan := &domain.DailyPlan{
		UserID:  3,
		Date:    date,
		Status:  domain.PlanStatusDraft,
		Summary: "v1",
		TimeBlocks: []domain.TimeBlock{
			{Type: domain.TimeBlockTypeBreak, Title: "Morning", StartTime: "08:00", EndTime: "09:00"},
		},
	}
	if err := repo.Create(ctx, plan); err != nil {
		t.Fatalf("create plan: %v", err)
	}

	plan.Summary = "v2"
	plan.TimeBlocks = []domain.TimeBlock{
		{Type: domain.TimeBlockTypeWork, Title: "Deep Work", StartTime: "10:00", EndTime: "11:00"},
	}
	if err := repo.Update(ctx, plan); err != nil {
		t.Fatalf("update plan: %v", err)
	}

	stored, err := repo.FindByID(ctx, plan.ID)
	if err != nil {
		t.Fatalf("find plan: %v", err)
	}
	if stored.Summary != "v2" {
		t.Fatalf("expected updated summary, got %q", stored.Summary)
	}
	if len(stored.TimeBlocks) != 1 {
		t.Fatalf("expected 1 time block after update, got %d", len(stored.TimeBlocks))
	}
	if stored.TimeBlocks[0].Title != "Deep Work" {
		t.Fatalf("unexpected time block after update: %+v", stored.TimeBlocks[0])
	}
}
