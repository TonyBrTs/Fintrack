package models

import "time"

// Goal represents a financial goal.
type Goal struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	TargetAmount  float64   `json:"target_amount"`
	CurrentAmount float64   `json:"current_amount"`
	Deadline      time.Time `json:"deadline"`
	Category      string    `json:"category"`
}
