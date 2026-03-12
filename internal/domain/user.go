package domain

import (
	"time"

	"gorm.io/gorm"
)

// User represents a planner user with personal preferences.
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"uniqueIndex;not null"`
	Timezone string `json:"timezone" gorm:"default:'Asia/Shanghai'"`

	// Daily schedule preferences
	WakeUpTime  string `json:"wake_up_time" gorm:"default:'07:00'"`  // HH:MM
	SleepTime   string `json:"sleep_time" gorm:"default:'23:00'"`    // HH:MM
	FocusStart  string `json:"focus_start" gorm:"default:'09:00'"`   // preferred deep work start
	FocusEnd    string `json:"focus_end" gorm:"default:'12:00'"`     // preferred deep work end
	MaxDailyWorkHours int `json:"max_daily_work_hours" gorm:"default:8"`

	Goals []Goal `json:"goals,omitempty" gorm:"foreignKey:UserID"`
}
