package service

import (
	"context"
	"fmt"
	"time"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

// PlannerService orchestrates the Goal → Task → DailyPlan pipeline.
type PlannerService struct {
	planRepo repository.PlanRepository
	taskRepo repository.TaskRepository
	userRepo repository.UserRepository
	planner  ai.Planner
}

func NewPlannerService(
	planRepo repository.PlanRepository,
	taskRepo repository.TaskRepository,
	userRepo repository.UserRepository,
	planner ai.Planner,
) *PlannerService {
	return &PlannerService{
		planRepo: planRepo,
		taskRepo: taskRepo,
		userRepo: userRepo,
		planner:  planner,
	}
}

// GeneratePlan creates (or regenerates) the daily plan for a user on the given date.
func (s *PlannerService) GeneratePlan(ctx context.Context, userID uint, date time.Time, hint string) (*domain.DailyPlan, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	tasks, err := s.taskRepo.FindPendingByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("fetch tasks: %w", err)
	}

	result, err := s.planner.GenerateDailyPlan(ctx, &ai.PlanRequest{
		User:      user,
		Tasks:     tasks,
		Date:      date,
		ExtraHint: hint,
	})
	if err != nil {
		return nil, fmt.Errorf("ai planner: %w", err)
	}

	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

	// Replace existing draft plan if one exists for this date
	existing, _ := s.planRepo.FindByUserIDAndDate(ctx, userID, dayStart)

	plan := &domain.DailyPlan{
		UserID:  userID,
		Date:    dayStart,
		Status:  domain.PlanStatusDraft,
		Summary: result.Summary,
	}

	for _, b := range result.TimeBlocks {
		plan.TimeBlocks = append(plan.TimeBlocks, domain.TimeBlock{
			TaskID:    b.TaskID,
			Type:      b.Type,
			Title:     b.Title,
			StartTime: b.StartTime,
			EndTime:   b.EndTime,
			Note:      b.Note,
		})
	}

	if existing != nil {
		plan.ID = existing.ID
		if err := s.planRepo.Update(ctx, plan); err != nil {
			return nil, fmt.Errorf("update plan: %w", err)
		}
		return plan, nil
	}

	if err := s.planRepo.Create(ctx, plan); err != nil {
		return nil, fmt.Errorf("create plan: %w", err)
	}
	return plan, nil
}

// GetToday returns today's plan for a user, generating one if it doesn't exist.
func (s *PlannerService) GetToday(ctx context.Context, userID uint) (*domain.DailyPlan, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	plan, err := s.planRepo.FindByUserIDAndDate(ctx, userID, today)
	if err != nil {
		return s.GeneratePlan(ctx, userID, today, "")
	}
	return plan, nil
}

// ConfirmPlan marks a plan as confirmed by the user.
func (s *PlannerService) ConfirmPlan(ctx context.Context, planID uint) (*domain.DailyPlan, error) {
	plan, err := s.planRepo.FindByID(ctx, planID)
	if err != nil {
		return nil, err
	}
	plan.Status = domain.PlanStatusConfirmed
	if err := s.planRepo.Update(ctx, plan); err != nil {
		return nil, err
	}
	return plan, nil
}
