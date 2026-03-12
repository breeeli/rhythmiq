package sqlite

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/gorm"
)

type goalRepo struct {
	db *gorm.DB
}

func NewGoalRepo(db *gorm.DB) *goalRepo {
	return &goalRepo{db: db}
}

func (r *goalRepo) Create(ctx context.Context, goal *domain.Goal) error {
	return r.db.WithContext(ctx).Create(goal).Error
}

func (r *goalRepo) FindByID(ctx context.Context, id uint) (*domain.Goal, error) {
	var goal domain.Goal
	if err := r.db.WithContext(ctx).Preload("Tasks").First(&goal, id).Error; err != nil {
		return nil, fmt.Errorf("goal not found: %w", err)
	}
	return &goal, nil
}

func (r *goalRepo) FindByUserID(ctx context.Context, userID uint) ([]*domain.Goal, error) {
	var goals []*domain.Goal
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("priority DESC, created_at DESC").
		Find(&goals).Error; err != nil {
		return nil, err
	}
	return goals, nil
}

func (r *goalRepo) Update(ctx context.Context, goal *domain.Goal) error {
	return r.db.WithContext(ctx).Save(goal).Error
}

func (r *goalRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Goal{}, id).Error
}
