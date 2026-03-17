package domain

import (
	"time"

	"gorm.io/gorm"
)

type PlanStatus string
type TimeBlockType string

const (
	PlanStatusDraft     PlanStatus = "draft"
	PlanStatusConfirmed PlanStatus = "confirmed"
	PlanStatusCompleted PlanStatus = "completed"

	TimeBlockTypeWork     TimeBlockType = "work"
	TimeBlockTypeBreak    TimeBlockType = "break"
	TimeBlockTypePersonal TimeBlockType = "personal"
	TimeBlockTypeBuffer   TimeBlockType = "buffer"
)

// DailyPlan represents a full day's schedule generated for a user.
type DailyPlan struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	UserID  uint       `json:"user_id" gorm:"not null;index"`
	Date    time.Time  `json:"date" gorm:"not null;index"` // date only, stored as UTC midnight
	Status  PlanStatus `json:"status" gorm:"default:'draft'"`
	Summary string     `json:"summary"` // AI-generated summary
	Context string     `json:"context"`

	TimeBlocks []TimeBlock `json:"time_blocks,omitempty" gorm:"foreignKey:PlanID"`
}

// TimeBlock is a scheduled slot within a DailyPlan.
type TimeBlock struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	PlanID         uint                `json:"plan_id" gorm:"not null;index"`
	TaskID         *uint               `json:"task_id,omitempty" gorm:"index"`
	Type           TimeBlockType       `json:"type" gorm:"default:'work'"`
	Title          string              `json:"title" gorm:"not null"`
	StartTime      string              `json:"start_time"` // HH:MM
	EndTime        string              `json:"end_time"`   // HH:MM
	Note           string              `json:"note"`
	Description    string              `json:"description"`
	Goal           string              `json:"goal"`
	ExpectedOutput string              `json:"expected_output"`
	SourceType     PlanBlockSourceType `json:"source_type"`
	IsLocked       bool                `json:"is_locked" gorm:"default:false"`
	Done           bool                `json:"done" gorm:"default:false"`

	Task *Task `json:"task,omitempty" gorm:"foreignKey:TaskID"`
}
