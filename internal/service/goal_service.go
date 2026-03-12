package service

import (
	"context"
	"fmt"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type GoalService struct {
	repo repository.GoalRepository
}

func NewGoalService(repo repository.GoalRepository) *GoalService {
	return &GoalService{repo: repo}
}

func (s *GoalService) Create(ctx context.Context, userID uint, req CreateGoalRequest) (*domain.Goal, error) {
	goal := &domain.Goal{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Type:        domain.GoalType(orDefault(string(req.Type), string(domain.GoalTypeShortTerm))),
		Status:      domain.GoalStatusActive,
		Priority:    domain.GoalPriority(orDefault(string(req.Priority), string(domain.GoalPriorityMedium))),
		Deadline:    req.Deadline,
	}
	if err := s.repo.Create(ctx, goal); err != nil {
		return nil, fmt.Errorf("create goal: %w", err)
	}
	return goal, nil
}

func (s *GoalService) GetByID(ctx context.Context, id uint) (*domain.Goal, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *GoalService) ListByUser(ctx context.Context, userID uint) ([]*domain.Goal, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *GoalService) Update(ctx context.Context, id uint, req UpdateGoalRequest) (*domain.Goal, error) {
	goal, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Title != "" {
		goal.Title = req.Title
	}
	if req.Description != "" {
		goal.Description = req.Description
	}
	if req.Status != "" {
		goal.Status = req.Status
	}
	if req.Priority != "" {
		goal.Priority = req.Priority
	}
	if req.Deadline != nil {
		goal.Deadline = req.Deadline
	}
	if req.Progress >= 0 {
		goal.Progress = req.Progress
	}

	if err := s.repo.Update(ctx, goal); err != nil {
		return nil, fmt.Errorf("update goal: %w", err)
	}
	return goal, nil
}

func (s *GoalService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

type CreateGoalRequest struct {
	Title       string
	Description string
	Type        domain.GoalType
	Priority    domain.GoalPriority
	Deadline    *time.Time
}

type UpdateGoalRequest struct {
	Title       string
	Description string
	Status      domain.GoalStatus
	Priority    domain.GoalPriority
	Deadline    *time.Time
	Progress    int
}
