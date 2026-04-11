package service

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type SubtaskService struct {
	repo     repository.SubtaskRepository
	taskRepo repository.TaskRepository
}

func NewSubtaskService(repo repository.SubtaskRepository, taskRepo repository.TaskRepository) *SubtaskService {
	return &SubtaskService{repo: repo, taskRepo: taskRepo}
}

func (s *SubtaskService) Create(ctx context.Context, req CreateSubtaskRequest) (*domain.Subtask, error) {
	task, err := s.taskRepo.FindByID(ctx, req.TaskID)
	if err != nil {
		return nil, err
	}

	sequence := len(task.Subtasks) + 1
	subtask := &domain.Subtask{
		TaskID:             req.TaskID,
		Title:              req.Title,
		Description:        req.Description,
		Status:             domain.SubtaskStatusTodo,
		Priority:           domain.TaskPriority(orDefault(string(req.Priority), string(task.Priority))),
		EstimatedMinutes:   req.EstimatedMinutes,
		PreferWindow:       orDefault(req.PreferWindow, "any"),
		Sequence:           sequence,
		DependsOnSubtaskID: req.DependsOnSubtaskID,
		LLMGenerated:       req.LLMGenerated,
	}
	if subtask.EstimatedMinutes == 0 {
		subtask.EstimatedMinutes = 30
	}

	if err := s.repo.Create(ctx, subtask); err != nil {
		return nil, fmt.Errorf("create subtask: %w", err)
	}
	return subtask, nil
}

func (s *SubtaskService) ListByTask(ctx context.Context, taskID uint) ([]*domain.Subtask, error) {
	return s.repo.FindByTaskID(ctx, taskID)
}

func (s *SubtaskService) Update(ctx context.Context, id uint, req UpdateSubtaskRequest) (*domain.Subtask, error) {
	subtask, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Title != "" {
		subtask.Title = req.Title
	}
	if req.Description != "" {
		subtask.Description = req.Description
	}
	if req.Status != "" {
		subtask.Status = req.Status
	}
	if req.Priority != "" {
		subtask.Priority = req.Priority
	}
	if req.EstimatedMinutes > 0 {
		subtask.EstimatedMinutes = req.EstimatedMinutes
	}
	if req.ActualMinutes > 0 {
		subtask.ActualMinutes = req.ActualMinutes
	}
	if req.PreferWindow != "" {
		subtask.PreferWindow = req.PreferWindow
	}
	if err := s.repo.Update(ctx, subtask); err != nil {
		return nil, fmt.Errorf("update subtask: %w", err)
	}
	return subtask, nil
}

type CreateSubtaskRequest struct {
	TaskID             uint
	Title              string
	Description        string
	Priority           domain.TaskPriority
	EstimatedMinutes   int
	PreferWindow       string
	DependsOnSubtaskID *uint
	LLMGenerated       bool
}

type UpdateSubtaskRequest struct {
	Title            string
	Description      string
	Status           domain.SubtaskStatus
	Priority         domain.TaskPriority
	EstimatedMinutes int
	ActualMinutes    int
	PreferWindow     string
}
