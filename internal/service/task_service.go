package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type TaskService struct {
	repo repository.TaskRepository
}

func NewTaskService(repo repository.TaskRepository) *TaskService {
	return &TaskService{repo: repo}
}

func (s *TaskService) Create(ctx context.Context, userID uint, req CreateTaskRequest) (*domain.Task, error) {
	if err := validateTaskInput(req.Title, req.Status, req.Priority, req.EstimatedMinutes, 0); err != nil {
		return nil, err
	}
	status := req.Status
	if status == "" {
		status = domain.TaskStatusTodo
	}
	priority := req.Priority
	if priority == "" {
		priority = domain.TaskPriorityMedium
	}
	task := &domain.Task{
		UserID:           userID,
		GoalID:           req.GoalID,
		Title:            strings.TrimSpace(req.Title),
		Description:      req.Description,
		ExpectedOutput:   req.ExpectedOutput,
		Status:           status,
		Priority:         priority,
		EstimatedMinutes: req.EstimatedMinutes,
		DueDate:          req.DueDate,
		PreferMorning:    req.PreferMorning,
		NeedsFocus:       req.NeedsFocus,
		Sequence:         req.Sequence,
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
		task.Title = strings.TrimSpace(req.Title)
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.ExpectedOutput != "" {
		task.ExpectedOutput = req.ExpectedOutput
	}
	if req.Status != "" {
		if !validTaskStatus(req.Status) {
			return nil, ValidationError{Field: "status", Message: "unsupported task status"}
		}
		task.Status = req.Status
	}
	if req.Priority != "" {
		if !validTaskPriority(req.Priority) {
			return nil, ValidationError{Field: "priority", Message: "unsupported task priority"}
		}
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
	if req.Sequence != nil {
		task.Sequence = *req.Sequence
	}
	if err := s.repo.Update(ctx, task); err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return task, nil
}

func (s *TaskService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

type CreateTaskRequest struct {
	GoalID           *uint
	Title            string
	Description      string
	ExpectedOutput   string
	Status           domain.TaskStatus
	Priority         domain.TaskPriority
	EstimatedMinutes int
	DueDate          *time.Time
	PreferMorning    bool
	NeedsFocus       bool
	Sequence         int
	Tags             string
}

type UpdateTaskRequest struct {
	Title            string
	Description      string
	ExpectedOutput   string
	Status           domain.TaskStatus
	Priority         domain.TaskPriority
	EstimatedMinutes int
	ActualMinutes    int
	DueDate          *time.Time
	Sequence         *int
}

func validateTaskInput(title string, status domain.TaskStatus, priority domain.TaskPriority, estimatedMinutes, actualMinutes int) error {
	if strings.TrimSpace(title) == "" {
		return ValidationError{Field: "title", Message: "is required"}
	}
	if status != "" && !validTaskStatus(status) {
		return ValidationError{Field: "status", Message: "unsupported task status"}
	}
	if priority != "" && !validTaskPriority(priority) {
		return ValidationError{Field: "priority", Message: "unsupported task priority"}
	}
	if estimatedMinutes < 0 {
		return ValidationError{Field: "estimated_minutes", Message: "must be zero or greater"}
	}
	if actualMinutes < 0 {
		return ValidationError{Field: "actual_minutes", Message: "must be zero or greater"}
	}
	return nil
}

func validTaskStatus(status domain.TaskStatus) bool {
	switch status {
	case domain.TaskStatusTodo, domain.TaskStatusInProgress, domain.TaskStatusDone, domain.TaskStatusSkipped:
		return true
	default:
		return false
	}
}

func validTaskPriority(priority domain.TaskPriority) bool {
	switch priority {
	case domain.TaskPriorityHigh, domain.TaskPriorityMedium, domain.TaskPriorityLow:
		return true
	default:
		return false
	}
}
