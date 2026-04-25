package sqlite

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/gorm"
)

type taskRepo struct {
	db *gorm.DB
}

func NewTaskRepo(db *gorm.DB) *taskRepo {
	return &taskRepo{db: db}
}

func (r *taskRepo) Create(ctx context.Context, task *domain.Task) error {
	return r.db.WithContext(ctx).Create(task).Error
}

func (r *taskRepo) FindByID(ctx context.Context, id uint) (*domain.Task, error) {
	var task domain.Task
	if err := r.db.WithContext(ctx).First(&task, id).Error; err != nil {
		return nil, fmt.Errorf("task not found: %w", err)
	}
	return &task, nil
}

func (r *taskRepo) FindByUserID(ctx context.Context, userID uint) ([]*domain.Task, error) {
	var tasks []*domain.Task
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("sequence ASC, created_at ASC").
		Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepo) FindByGoalID(ctx context.Context, goalID uint) ([]*domain.Task, error) {
	var tasks []*domain.Task
	if err := r.db.WithContext(ctx).
		Where("goal_id = ?", goalID).
		Order("sequence ASC, created_at ASC").
		Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepo) FindPendingByUserID(ctx context.Context, userID uint) ([]*domain.Task, error) {
	var tasks []*domain.Task
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND status IN ?", userID, []domain.TaskStatus{
			domain.TaskStatusTodo,
			domain.TaskStatusInProgress,
		}).
		Order("sequence ASC, created_at ASC").
		Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepo) Update(ctx context.Context, task *domain.Task) error {
	return r.db.WithContext(ctx).Save(task).Error
}

func (r *taskRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Task{}, id).Error
}
