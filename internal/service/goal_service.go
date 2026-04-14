package service

import (
	"context"
	"fmt"
	"time"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type GoalService struct {
	repo      repository.GoalRepository
	taskRepo  repository.TaskRepository
	generator ai.GoalGenerator
}

func NewGoalService(repo repository.GoalRepository, taskRepo repository.TaskRepository, generator ai.GoalGenerator) *GoalService {
	return &GoalService{repo: repo, taskRepo: taskRepo, generator: generator}
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

func (s *GoalService) Generate(ctx context.Context, userID uint, req GenerateGoalRequest) (*domain.Goal, error) {
	if s.generator == nil {
		return nil, fmt.Errorf("goal generator is not configured")
	}

	result, err := s.generator.GenerateGoal(ctx, &ai.GoalGenerationRequest{
		Prompt:      req.Prompt,
		ContextText: req.ContextText,
	})
	if err != nil {
		return nil, fmt.Errorf("generate goal: %w", err)
	}

	goal := &domain.Goal{
		UserID:      userID,
		Title:       result.Goal.Title,
		Description: result.Goal.Description,
		Type:        result.Goal.Type,
		Status:      domain.GoalStatusActive,
		Priority:    result.Goal.Priority,
		Deadline:    result.Goal.Deadline,
	}
	if err := s.repo.Create(ctx, goal); err != nil {
		return nil, fmt.Errorf("create goal: %w", err)
	}

	for index, outline := range result.Goal.Tasks {
		task := &domain.Task{
			UserID:           userID,
			GoalID:           &goal.ID,
			Title:            outline.Title,
			Description:      outline.Description,
			Status:           domain.TaskStatusTodo,
			Priority:         outline.Priority,
			EstimatedMinutes: outline.EstimatedMinutes,
		}
		if task.Priority == "" {
			task.Priority = domain.TaskPriorityMedium
		}
		if task.EstimatedMinutes == 0 {
			task.EstimatedMinutes = 30
		}
		if err := s.taskRepo.Create(ctx, task); err != nil {
			return nil, fmt.Errorf("create generated task %d: %w", index+1, err)
		}
	}

	return s.repo.FindByID(ctx, goal.ID)
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

type GenerateGoalRequest struct {
	Prompt      string
	ContextText string
}
