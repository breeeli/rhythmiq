package sqlite

import (
	"context"
	"fmt"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/gorm"
)

type planRepo struct {
	db *gorm.DB
}

func NewPlanRepo(db *gorm.DB) *planRepo {
	return &planRepo{db: db}
}

func (r *planRepo) Create(ctx context.Context, plan *domain.DailyPlan) error {
	return r.db.WithContext(ctx).Create(plan).Error
}

func (r *planRepo) FindByID(ctx context.Context, id uint) (*domain.DailyPlan, error) {
	var plan domain.DailyPlan
	if err := r.db.WithContext(ctx).
		Preload("TimeBlocks").
		Preload("TimeBlocks.Task").
		First(&plan, id).Error; err != nil {
		return nil, fmt.Errorf("plan not found: %w", err)
	}
	return &plan, nil
}

func (r *planRepo) FindByUserIDAndDate(ctx context.Context, userID uint, date time.Time) (*domain.DailyPlan, error) {
	start := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)

	var plan domain.DailyPlan
	if err := r.db.WithContext(ctx).
		Preload("TimeBlocks").
		Preload("TimeBlocks.Task").
		Where("user_id = ? AND date >= ? AND date < ?", userID, start, end).
		First(&plan).Error; err != nil {
		return nil, fmt.Errorf("plan not found: %w", err)
	}
	return &plan, nil
}

func (r *planRepo) FindByUserID(ctx context.Context, userID uint) ([]*domain.DailyPlan, error) {
	var plans []*domain.DailyPlan
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("date DESC").
		Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *planRepo) Update(ctx context.Context, plan *domain.DailyPlan) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&domain.DailyPlan{}).
			Where("id = ?", plan.ID).
			Updates(map[string]interface{}{
				"user_id": plan.UserID,
				"date":    plan.Date,
				"status":  plan.Status,
				"summary": plan.Summary,
				"context": plan.Context,
			}).Error; err != nil {
			return err
		}

		if err := tx.Where("plan_id = ?", plan.ID).Delete(&domain.TimeBlock{}).Error; err != nil {
			return err
		}

		for i := range plan.TimeBlocks {
			plan.TimeBlocks[i].ID = 0
			plan.TimeBlocks[i].PlanID = plan.ID
		}
		if len(plan.TimeBlocks) == 0 {
			return nil
		}
		return tx.Create(&plan.TimeBlocks).Error
	})
}

func (r *planRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.DailyPlan{}, id).Error
}
