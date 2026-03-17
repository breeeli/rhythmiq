package sqlite

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/gorm"
)

type scheduleRuleRepo struct {
	db *gorm.DB
}

func NewScheduleRuleRepo(db *gorm.DB) *scheduleRuleRepo {
	return &scheduleRuleRepo{db: db}
}

func (r *scheduleRuleRepo) Create(ctx context.Context, rule *domain.ScheduleRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *scheduleRuleRepo) FindByID(ctx context.Context, id uint) (*domain.ScheduleRule, error) {
	var rule domain.ScheduleRule
	if err := r.db.WithContext(ctx).First(&rule, id).Error; err != nil {
		return nil, fmt.Errorf("schedule rule not found: %w", err)
	}
	return &rule, nil
}

func (r *scheduleRuleRepo) FindByUserID(ctx context.Context, userID uint) ([]*domain.ScheduleRule, error) {
	var rules []*domain.ScheduleRule
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("start_time ASC").
		Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *scheduleRuleRepo) Update(ctx context.Context, rule *domain.ScheduleRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *scheduleRuleRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.ScheduleRule{}, id).Error
}
