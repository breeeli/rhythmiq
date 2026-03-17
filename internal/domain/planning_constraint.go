package domain

import (
	"time"

	"gorm.io/gorm"
)

type ScheduleRuleKind string
type HabitTimePreference string
type PlanBlockSourceType string

const (
	ScheduleRuleKindFixed   ScheduleRuleKind = "fixed"
	ScheduleRuleKindBlocked ScheduleRuleKind = "blocked"

	HabitTimePreferenceMorning   HabitTimePreference = "morning"
	HabitTimePreferenceAfternoon HabitTimePreference = "afternoon"
	HabitTimePreferenceEvening   HabitTimePreference = "evening"
	HabitTimePreferenceAny       HabitTimePreference = "any"

	PlanBlockSourceSchedule PlanBlockSourceType = "schedule_rule"
	PlanBlockSourceHabit    PlanBlockSourceType = "habit_rule"
	PlanBlockSourceAnchor   PlanBlockSourceType = "anchored_item"
	PlanBlockSourceTask     PlanBlockSourceType = "task"
	PlanBlockSourceContext  PlanBlockSourceType = "context_item"
	PlanBlockSourceReview   PlanBlockSourceType = "system_review"
)

// ScheduleRule defines a fixed or blocked recurring time range.
type ScheduleRule struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	UserID    uint             `json:"user_id" gorm:"not null;index"`
	Title     string           `json:"title" gorm:"not null"`
	Kind      ScheduleRuleKind `json:"kind" gorm:"default:'fixed'"`
	StartTime string           `json:"start_time" gorm:"not null"`
	EndTime   string           `json:"end_time" gorm:"not null"`
	Days      []string         `json:"days" gorm:"serializer:json"`
	Locked    bool             `json:"locked" gorm:"default:true"`
}

// HabitRule defines a recurring habit reservation.
type HabitRule struct {
	ID              uint                `json:"id" gorm:"primaryKey"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
	DeletedAt       gorm.DeletedAt      `json:"-" gorm:"index"`
	UserID          uint                `json:"user_id" gorm:"not null;index"`
	Title           string              `json:"title" gorm:"not null"`
	DurationMinutes int                 `json:"duration_minutes" gorm:"not null"`
	Days            []string            `json:"days" gorm:"serializer:json"`
	PreferredTime   HabitTimePreference `json:"preferred_time" gorm:"default:'any'"`
	PreferredStart  string              `json:"preferred_start"`
	Required        bool                `json:"required" gorm:"default:true"`
}
