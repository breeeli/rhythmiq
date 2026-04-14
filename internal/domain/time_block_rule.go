package domain

import (
	"time"

	"gorm.io/gorm"
)

type TimeBlockRecurrenceType string

const (
	TimeBlockRecurrenceNone   TimeBlockRecurrenceType = "NONE"
	TimeBlockRecurrenceDaily  TimeBlockRecurrenceType = "DAILY"
	TimeBlockRecurrenceWeekly TimeBlockRecurrenceType = "WEEKLY"
)

// TimeBlockRule represents a blocking constraint that cannot be scheduled over.
type TimeBlockRule struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	UserID         uint                    `json:"user_id" gorm:"not null;index"`
	Title          string                  `json:"title" gorm:"not null"`
	StartTime      string                  `json:"start_time" gorm:"not null"`
	EndTime        string                  `json:"end_time" gorm:"not null"`
	RecurrenceType TimeBlockRecurrenceType `json:"recurrence_type" gorm:"not null;default:'DAILY'"`
	DaysOfWeek     []string                `json:"days_of_week" gorm:"serializer:json"`
	Date           string                  `json:"date"`
}
