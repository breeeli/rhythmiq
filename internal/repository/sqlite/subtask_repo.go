package sqlite

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/gorm"
)

type subtaskRepo struct {
	db *gorm.DB
}

func NewSubtaskRepo(db *gorm.DB) *subtaskRepo {
	return &subtaskRepo{db: db}
}

func (r *subtaskRepo) Create(ctx context.Context, subtask *domain.Subtask) error {
	return r.db.WithContext(ctx).Create(subtask).Error
}

func (r *subtaskRepo) FindByID(ctx context.Context, id uint) (*domain.Subtask, error) {
	var subtask domain.Subtask
	if err := r.db.WithContext(ctx).First(&subtask, id).Error; err != nil {
		return nil, fmt.Errorf("subtask not found: %w", err)
	}
	return &subtask, nil
}

func (r *subtaskRepo) FindByTaskID(ctx context.Context, taskID uint) ([]*domain.Subtask, error) {
	var subtasks []*domain.Subtask
	if err := r.db.WithContext(ctx).
		Where("task_id = ?", taskID).
		Order("sequence ASC, created_at ASC").
		Find(&subtasks).Error; err != nil {
		return nil, err
	}
	return subtasks, nil
}

func (r *subtaskRepo) Update(ctx context.Context, subtask *domain.Subtask) error {
	return r.db.WithContext(ctx).Save(subtask).Error
}

func (r *subtaskRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Subtask{}, id).Error
}
