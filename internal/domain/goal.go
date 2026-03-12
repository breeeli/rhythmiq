package domain

import (
	"time"

	"gorm.io/gorm"
)

type GoalStatus string
type GoalPriority string
type GoalType string

const (
	GoalStatusActive    GoalStatus = "active"
	GoalStatusCompleted GoalStatus = "completed"
	GoalStatusArchived  GoalStatus = "archived"

	GoalPriorityHigh   GoalPriority = "high"
	GoalPriorityMedium GoalPriority = "medium"
	GoalPriorityLow    GoalPriority = "low"

	GoalTypeLongTerm  GoalType = "long_term"
	GoalTypeShortTerm GoalType = "short_term"
)

// Goal represents a user's objective (long-term or short-term).
type Goal struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	UserID      uint         `json:"user_id" gorm:"not null;index"`
	Title       string       `json:"title" gorm:"not null"`
	Description string       `json:"description"`
	Type        GoalType     `json:"type" gorm:"default:'short_term'"`
	Status      GoalStatus   `json:"status" gorm:"default:'active'"`
	Priority    GoalPriority `json:"priority" gorm:"default:'medium'"`
	Deadline    *time.Time   `json:"deadline,omitempty"`
	Progress    int          `json:"progress" gorm:"default:0"` // 0-100

	Tasks []Task `json:"tasks,omitempty" gorm:"foreignKey:GoalID"`
}
