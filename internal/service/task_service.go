package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type TaskService struct {
	repo        repository.TaskRepository
	subtaskRepo repository.SubtaskRepository
	decomposer  ai.TaskDecomposer
}

func NewTaskService(
	repo repository.TaskRepository,
	subtaskRepo repository.SubtaskRepository,
	decomposer ai.TaskDecomposer,
) *TaskService {
	return &TaskService{repo: repo, subtaskRepo: subtaskRepo, decomposer: decomposer}
}

func (s *TaskService) Create(ctx context.Context, userID uint, req CreateTaskRequest) (*domain.Task, error) {
	task := &domain.Task{
		UserID:           userID,
		GoalID:           req.GoalID,
		Title:            req.Title,
		Description:      req.Description,
		Status:           domain.TaskStatusTodo,
		Priority:         domain.TaskPriority(orDefault(string(req.Priority), string(domain.TaskPriorityMedium))),
		EstimatedMinutes: req.EstimatedMinutes,
		DueDate:          req.DueDate,
		PreferMorning:    req.PreferMorning,
		NeedsFocus:       req.NeedsFocus,
		Tags:             req.Tags,
	}
	if task.EstimatedMinutes == 0 {
		task.EstimatedMinutes = 30
	}
	if err := s.repo.Create(ctx, task); err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	return task, nil
}

func (s *TaskService) GetByID(ctx context.Context, id uint) (*domain.Task, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *TaskService) ListByUser(ctx context.Context, userID uint) ([]*domain.Task, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *TaskService) Update(ctx context.Context, id uint, req UpdateTaskRequest) (*domain.Task, error) {
	task, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Status != "" {
		task.Status = req.Status
	}
	if req.Priority != "" {
		task.Priority = req.Priority
	}
	if req.EstimatedMinutes > 0 {
		task.EstimatedMinutes = req.EstimatedMinutes
	}
	if req.ActualMinutes > 0 {
		task.ActualMinutes = req.ActualMinutes
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}

	if err := s.repo.Update(ctx, task); err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return task, nil
}

func (s *TaskService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func (s *TaskService) Decompose(ctx context.Context, id uint) (*domain.Task, error) {
	if s.decomposer == nil {
		return nil, fmt.Errorf("task decomposer is not configured")
	}

	task, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	result, err := s.decomposer.DecomposeTask(ctx, &ai.TaskDecompositionRequest{Task: task})
	if err != nil {
		return nil, fmt.Errorf("decompose task: %w", err)
	}

	manualCount := 0
	for _, subtask := range task.Subtasks {
		if subtask.LLMGenerated {
			if err := s.subtaskRepo.Delete(ctx, subtask.ID); err != nil {
				return nil, fmt.Errorf("delete generated subtask %d: %w", subtask.ID, err)
			}
			continue
		}
		manualCount++
	}

	sequence := manualCount + 1
	for _, suggestion := range result.Subtasks {
		if strings.TrimSpace(suggestion.Title) == "" {
			continue
		}
		subtask := &domain.Subtask{
			TaskID:           task.ID,
			Title:            suggestion.Title,
			Description:      suggestion.Description,
			Status:           domain.SubtaskStatusTodo,
			Priority:         domain.TaskPriority(orDefault(string(suggestion.Priority), string(task.Priority))),
			EstimatedMinutes: suggestion.EstimatedMinutes,
			PreferWindow:     orDefault(suggestion.PreferWindow, "any"),
			Sequence:         sequence,
			LLMGenerated:     true,
		}
		if subtask.EstimatedMinutes == 0 {
			subtask.EstimatedMinutes = 30
		}
		if err := s.subtaskRepo.Create(ctx, subtask); err != nil {
			return nil, fmt.Errorf("create generated subtask: %w", err)
		}
		sequence++
	}

	return s.repo.FindByID(ctx, id)
}

type CreateTaskRequest struct {
	GoalID           *uint
	Title            string
	Description      string
	Priority         domain.TaskPriority
	EstimatedMinutes int
	DueDate          *time.Time
	PreferMorning    bool
	NeedsFocus       bool
	Tags             string
}

type UpdateTaskRequest struct {
	Title            string
	Description      string
	Status           domain.TaskStatus
	Priority         domain.TaskPriority
	EstimatedMinutes int
	ActualMinutes    int
	DueDate          *time.Time
}
