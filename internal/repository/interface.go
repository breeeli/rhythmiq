package repository

import (
	"context"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByID(ctx context.Context, id uint) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id uint) error
}

type GoalRepository interface {
	Create(ctx context.Context, goal *domain.Goal) error
	FindByID(ctx context.Context, id uint) (*domain.Goal, error)
	FindByUserID(ctx context.Context, userID uint) ([]*domain.Goal, error)
	Update(ctx context.Context, goal *domain.Goal) error
	Delete(ctx context.Context, id uint) error
}

type TaskRepository interface {
	Create(ctx context.Context, task *domain.Task) error
	FindByID(ctx context.Context, id uint) (*domain.Task, error)
	FindByUserID(ctx context.Context, userID uint) ([]*domain.Task, error)
	FindByGoalID(ctx context.Context, goalID uint) ([]*domain.Task, error)
	FindPendingByUserID(ctx context.Context, userID uint) ([]*domain.Task, error)
	Update(ctx context.Context, task *domain.Task) error
	Delete(ctx context.Context, id uint) error
}

type SubtaskRepository interface {
	Create(ctx context.Context, subtask *domain.Subtask) error
	FindByID(ctx context.Context, id uint) (*domain.Subtask, error)
	FindByTaskID(ctx context.Context, taskID uint) ([]*domain.Subtask, error)
	Update(ctx context.Context, subtask *domain.Subtask) error
	Delete(ctx context.Context, id uint) error
}

type ScheduleRuleRepository interface {
	Create(ctx context.Context, rule *domain.ScheduleRule) error
	FindByID(ctx context.Context, id uint) (*domain.ScheduleRule, error)
	FindByUserID(ctx context.Context, userID uint) ([]*domain.ScheduleRule, error)
	Update(ctx context.Context, rule *domain.ScheduleRule) error
	Delete(ctx context.Context, id uint) error
}

type HabitRuleRepository interface {
	Create(ctx context.Context, rule *domain.HabitRule) error
	FindByID(ctx context.Context, id uint) (*domain.HabitRule, error)
	FindByUserID(ctx context.Context, userID uint) ([]*domain.HabitRule, error)
	Update(ctx context.Context, rule *domain.HabitRule) error
	Delete(ctx context.Context, id uint) error
}

type TimeBlockRuleRepository interface {
	Create(ctx context.Context, rule *domain.TimeBlockRule) error
	FindByID(ctx context.Context, id uint) (*domain.TimeBlockRule, error)
	FindByUserID(ctx context.Context, userID uint) ([]*domain.TimeBlockRule, error)
	Update(ctx context.Context, rule *domain.TimeBlockRule) error
	Delete(ctx context.Context, id uint) error
}

type PlanRepository interface {
	Create(ctx context.Context, plan *domain.DailyPlan) error
	FindByID(ctx context.Context, id uint) (*domain.DailyPlan, error)
	FindByUserIDAndDate(ctx context.Context, userID uint, date time.Time) (*domain.DailyPlan, error)
	FindByUserID(ctx context.Context, userID uint) ([]*domain.DailyPlan, error)
	Update(ctx context.Context, plan *domain.DailyPlan) error
	Delete(ctx context.Context, id uint) error
}
