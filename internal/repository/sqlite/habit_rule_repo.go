package sqlite

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/gorm"
)

type habitRuleRepo struct {
	db *gorm.DB
}

func NewHabitRuleRepo(db *gorm.DB) *habitRuleRepo {
	return &habitRuleRepo{db: db}
}

func (r *habitRuleRepo) Create(ctx context.Context, rule *domain.HabitRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *habitRuleRepo) FindByID(ctx context.Context, id uint) (*domain.HabitRule, error) {
	var rule domain.HabitRule
	if err := r.db.WithContext(ctx).First(&rule, id).Error; err != nil {
		return nil, fmt.Errorf("habit rule not found: %w", err)
	}
	return &rule, nil
}

func (r *habitRuleRepo) FindByUserID(ctx context.Context, userID uint) ([]*domain.HabitRule, error) {
	var rules []*domain.HabitRule
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("preferred_start ASC, title ASC").
		Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *habitRuleRepo) Update(ctx context.Context, rule *domain.HabitRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *habitRuleRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.HabitRule{}, id).Error
}
