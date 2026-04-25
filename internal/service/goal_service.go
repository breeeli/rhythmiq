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

type GoalService struct {
	repo      repository.GoalRepository
	taskRepo  repository.TaskRepository
	generator ai.GoalGenerator
}

func NewGoalService(repo repository.GoalRepository, taskRepo repository.TaskRepository, generator ai.GoalGenerator) *GoalService {
	return &GoalService{repo: repo, taskRepo: taskRepo, generator: generator}
}

func (s *GoalService) Create(ctx context.Context, userID uint, req CreateGoalRequest) (*domain.Goal, error) {
	if err := validateGoalInput(req.Title, req.Status, req.Source, req.Priority, req.Progress); err != nil {
		return nil, err
	}
	status := req.Status
	if status == "" {
		status = domain.GoalStatusActive
	}
	source := req.Source
	if source == "" {
		source = domain.GoalSourceManual
	}
	priority := req.Priority
	if priority == "" {
		priority = domain.GoalPriorityMedium
	}
	goal := &domain.Goal{
		UserID:          userID,
		ParentGoalID:    req.ParentGoalID,
		Title:           strings.TrimSpace(req.Title),
		Description:     req.Description,
		Status:          status,
		Source:          source,
		Priority:        priority,
		Deadline:        req.Deadline,
		StartDate:       firstTime(req.StartDate, nil),
		TargetDate:      firstTime(req.TargetDate, req.Deadline),
		ReviewDate:      req.ReviewDate,
		Outcome:         req.Outcome,
		SuccessCriteria: cleanStrings(req.SuccessCriteria),
		Motivation:      req.Motivation,
		Progress:        req.Progress,
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
		Status:      domain.GoalStatusDraft,
		Source:      domain.GoalSourceLLM,
		Priority:    result.Goal.Priority,
		Deadline:    result.Goal.Deadline,
		TargetDate:  result.Goal.Deadline,
		Outcome:     result.Goal.Description,
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
			ExpectedOutput:   outline.Description,
			Status:           domain.TaskStatusTodo,
			Priority:         outline.Priority,
			EstimatedMinutes: outline.EstimatedMinutes,
			Sequence:         index + 1,
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
		goal.Title = strings.TrimSpace(req.Title)
	}
	if req.ParentGoalID != nil {
		if *req.ParentGoalID == id {
			return nil, ValidationError{Field: "parent_goal_id", Message: "cannot reference itself"}
		}
		goal.ParentGoalID = req.ParentGoalID
	}
	if req.Description != "" {
		goal.Description = req.Description
	}
	if req.Status != "" {
		if !validGoalStatus(req.Status) {
			return nil, ValidationError{Field: "status", Message: "unsupported goal status"}
		}
		goal.Status = req.Status
	}
	if req.Source != "" {
		if !validGoalSource(req.Source) {
			return nil, ValidationError{Field: "source", Message: "unsupported goal source"}
		}
		goal.Source = req.Source
	}
	if req.Priority != "" {
		if !validGoalPriority(req.Priority) {
			return nil, ValidationError{Field: "priority", Message: "unsupported goal priority"}
		}
		goal.Priority = req.Priority
	}
	if req.Deadline != nil {
		goal.Deadline = req.Deadline
	}
	if req.StartDate != nil {
		goal.StartDate = req.StartDate
	}
	if req.TargetDate != nil {
		goal.TargetDate = req.TargetDate
	}
	if req.ReviewDate != nil {
		goal.ReviewDate = req.ReviewDate
	}
	if req.Outcome != "" {
		goal.Outcome = req.Outcome
	}
	if req.SuccessCriteria != nil {
		goal.SuccessCriteria = cleanStrings(req.SuccessCriteria)
	}
	if req.Motivation != "" {
		goal.Motivation = req.Motivation
	}
	if req.Progress != nil {
		if *req.Progress < 0 || *req.Progress > 100 {
			return nil, ValidationError{Field: "progress", Message: "must be between 0 and 100"}
		}
		goal.Progress = *req.Progress
	}

	if err := s.repo.Update(ctx, goal); err != nil {
		return nil, fmt.Errorf("update goal: %w", err)
	}
	return goal, nil
}

func (s *GoalService) Delete(ctx context.Context, id uint) error {
	tasks, err := s.taskRepo.FindByGoalID(ctx, id)
	if err != nil {
		return fmt.Errorf("find goal tasks: %w", err)
	}
	for _, task := range tasks {
		if err := s.taskRepo.Delete(ctx, task.ID); err != nil {
			return fmt.Errorf("delete goal task %d: %w", task.ID, err)
		}
	}
	return s.repo.Delete(ctx, id)
}

type CreateGoalRequest struct {
	Title           string
	ParentGoalID    *uint
	Description     string
	Status          domain.GoalStatus
	Source          domain.GoalSource
	Priority        domain.GoalPriority
	Deadline        *time.Time
	StartDate       *time.Time
	TargetDate      *time.Time
	ReviewDate      *time.Time
	Outcome         string
	SuccessCriteria []string
	Motivation      string
	Progress        int
}

type UpdateGoalRequest struct {
	Title           string
	ParentGoalID    *uint
	Description     string
	Status          domain.GoalStatus
	Source          domain.GoalSource
	Priority        domain.GoalPriority
	Deadline        *time.Time
	StartDate       *time.Time
	TargetDate      *time.Time
	ReviewDate      *time.Time
	Outcome         string
	SuccessCriteria []string
	Motivation      string
	Progress        *int
}

type GenerateGoalRequest struct {
	Prompt      string
	ContextText string
}

func validateGoalInput(title string, status domain.GoalStatus, source domain.GoalSource, priority domain.GoalPriority, progress int) error {
	if strings.TrimSpace(title) == "" {
		return ValidationError{Field: "title", Message: "is required"}
	}
	if status != "" && !validGoalStatus(status) {
		return ValidationError{Field: "status", Message: "unsupported goal status"}
	}
	if source != "" && !validGoalSource(source) {
		return ValidationError{Field: "source", Message: "unsupported goal source"}
	}
	if priority != "" && !validGoalPriority(priority) {
		return ValidationError{Field: "priority", Message: "unsupported goal priority"}
	}
	if progress < 0 || progress > 100 {
		return ValidationError{Field: "progress", Message: "must be between 0 and 100"}
	}
	return nil
}

func validGoalStatus(status domain.GoalStatus) bool {
	switch status {
	case domain.GoalStatusDraft, domain.GoalStatusActive, domain.GoalStatusCompleted, domain.GoalStatusArchived, domain.GoalStatusAbandoned:
		return true
	default:
		return false
	}
}

func validGoalSource(source domain.GoalSource) bool {
	switch source {
	case domain.GoalSourceManual, domain.GoalSourceLLM:
		return true
	default:
		return false
	}
}

func validGoalPriority(priority domain.GoalPriority) bool {
	switch priority {
	case domain.GoalPriorityHigh, domain.GoalPriorityMedium, domain.GoalPriorityLow:
		return true
	default:
		return false
	}
}

func cleanStrings(values []string) []string {
	cleaned := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}
	return cleaned
}

func firstTime(primary, fallback *time.Time) *time.Time {
	if primary != nil {
		return primary
	}
	return fallback
}
