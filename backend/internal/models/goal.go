package models

import "time"

// Goal represents a financial goal.
type Goal struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	UserID        string    `json:"user_id" gorm:"type:uuid;not null;index"`
	Name          string    `json:"name" gorm:"type:text;not null"`
	TargetAmount  float64   `json:"target_amount" gorm:"type:numeric(12,2);not null"`
	CurrentAmount float64   `json:"current_amount" gorm:"type:numeric(12,2);default:0"`
	Deadline      time.Time `json:"deadline" gorm:"type:timestamptz;not null"`
	Category      string    `json:"category" gorm:"type:varchar(100);not null"`
	CreatedAt     time.Time `json:"created_at,omitempty" gorm:"type:timestamptz;autoCreateTime"`
}
