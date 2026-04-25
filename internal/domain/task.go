package domain

import (
	"time"

	"gorm.io/gorm"
)

type TaskStatus string
type TaskPriority string

const (
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusDone       TaskStatus = "done"
	TaskStatusSkipped    TaskStatus = "skipped"

	TaskPriorityHigh   TaskPriority = "high"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityLow    TaskPriority = "low"
)

// Task is an atomic, executable unit derived from a Goal.
type Task struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	UserID         uint         `json:"user_id" gorm:"not null;index"`
	GoalID         *uint        `json:"goal_id,omitempty" gorm:"index"` // optional, standalone tasks allowed
	Title          string       `json:"title" gorm:"not null"`
	Description    string       `json:"description"`
	ExpectedOutput string       `json:"expected_output"`
	Status         TaskStatus   `json:"status" gorm:"default:'todo'"`
	Priority       TaskPriority `json:"priority" gorm:"default:'medium'"`

	// Time estimation
	EstimatedMinutes int        `json:"estimated_minutes" gorm:"default:30"`
	ActualMinutes    int        `json:"actual_minutes" gorm:"default:0"`
	DueDate          *time.Time `json:"due_date,omitempty"`

	// Scheduling hints
	PreferMorning bool `json:"prefer_morning" gorm:"default:false"`
	NeedsFocus    bool `json:"needs_focus" gorm:"default:false"` // requires deep focus block

	Sequence int    `json:"sequence" gorm:"default:0"`
	Tags     string `json:"tags" gorm:"default:''"` // comma-separated

	Goal *Goal `json:"goal,omitempty" gorm:"foreignKey:GoalID"`
}
