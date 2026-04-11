package domain

import (
	"time"

	"gorm.io/gorm"
)

type SubtaskStatus string

const (
	SubtaskStatusTodo       SubtaskStatus = "todo"
	SubtaskStatusInProgress SubtaskStatus = "in_progress"
	SubtaskStatusDone       SubtaskStatus = "done"
	SubtaskStatusSkipped    SubtaskStatus = "skipped"
)

// Subtask is a smaller executable unit derived from a task.
type Subtask struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	TaskID             uint          `json:"task_id" gorm:"not null;index"`
	Title              string        `json:"title" gorm:"not null"`
	Description        string        `json:"description"`
	Status             SubtaskStatus `json:"status" gorm:"default:'todo'"`
	Priority           TaskPriority  `json:"priority" gorm:"default:'medium'"`
	EstimatedMinutes   int           `json:"estimated_minutes" gorm:"default:30"`
	ActualMinutes      int           `json:"actual_minutes" gorm:"default:0"`
	PreferWindow       string        `json:"prefer_window" gorm:"default:'any'"`
	Sequence           int           `json:"sequence" gorm:"default:0"`
	DependsOnSubtaskID *uint         `json:"depends_on_subtask_id,omitempty" gorm:"index"`
	LLMGenerated       bool          `json:"llm_generated" gorm:"default:false"`

	Task *Task `json:"task,omitempty" gorm:"foreignKey:TaskID"`
}
