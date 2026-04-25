package domain

import (
	"time"

	"gorm.io/gorm"
)

type GoalStatus string
type GoalPriority string
type GoalSource string

const (
	GoalStatusDraft     GoalStatus = "draft"
	GoalStatusActive    GoalStatus = "active"
	GoalStatusCompleted GoalStatus = "completed"
	GoalStatusArchived  GoalStatus = "archived"
	GoalStatusAbandoned GoalStatus = "abandoned"

	GoalPriorityHigh   GoalPriority = "high"
	GoalPriorityMedium GoalPriority = "medium"
	GoalPriorityLow    GoalPriority = "low"

	GoalSourceManual GoalSource = "manual"
	GoalSourceLLM    GoalSource = "llm"
)

// Goal represents a user's desired result and completion contract.
type Goal struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	UserID       uint         `json:"user_id" gorm:"not null;index"`
	ParentGoalID *uint        `json:"parent_goal_id,omitempty" gorm:"index"`
	Title        string       `json:"title" gorm:"not null"`
	Description  string       `json:"description"`
	Status       GoalStatus   `json:"status" gorm:"default:'active'"`
	Source       GoalSource   `json:"source" gorm:"default:'manual'"`
	Priority     GoalPriority `json:"priority" gorm:"default:'medium'"`
	Deadline     *time.Time   `json:"deadline,omitempty"`
	StartDate    *time.Time   `json:"start_date,omitempty"`
	TargetDate   *time.Time   `json:"target_date,omitempty"`
	ReviewDate   *time.Time   `json:"review_date,omitempty"`
	Outcome      string       `json:"outcome"`
	// SuccessCriteria stores concrete completion standards for the goal.
	SuccessCriteria []string `json:"success_criteria" gorm:"serializer:json"`
	Motivation      string   `json:"motivation"`
	Progress        int      `json:"progress" gorm:"default:0"` // 0-100

	ParentGoal *Goal  `json:"parent_goal,omitempty" gorm:"foreignKey:ParentGoalID"`
	ChildGoals []Goal `json:"child_goals,omitempty" gorm:"foreignKey:ParentGoalID"`
	Tasks      []Task `json:"tasks,omitempty" gorm:"foreignKey:GoalID"`
}
