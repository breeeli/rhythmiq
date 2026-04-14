package sqlite

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/gorm"
)

type timeBlockRuleRepo struct {
	db *gorm.DB
}

func NewTimeBlockRuleRepo(db *gorm.DB) *timeBlockRuleRepo {
	return &timeBlockRuleRepo{db: db}
}

func (r *timeBlockRuleRepo) Create(ctx context.Context, rule *domain.TimeBlockRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *timeBlockRuleRepo) FindByID(ctx context.Context, id uint) (*domain.TimeBlockRule, error) {
	var rule domain.TimeBlockRule
	if err := r.db.WithContext(ctx).First(&rule, id).Error; err != nil {
		return nil, fmt.Errorf("time block not found: %w", err)
	}
	return &rule, nil
}

func (r *timeBlockRuleRepo) FindByUserID(ctx context.Context, userID uint) ([]*domain.TimeBlockRule, error) {
	var rules []*domain.TimeBlockRule
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("recurrence_type ASC, start_time ASC, title ASC").
		Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *timeBlockRuleRepo) Update(ctx context.Context, rule *domain.TimeBlockRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *timeBlockRuleRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.TimeBlockRule{}, id).Error
}
