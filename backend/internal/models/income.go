package models

import "time"

// Income represents a financial income.
type Income struct {
	ID            string    `json:"id"`
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Description   string    `json:"description"`
	Source        string    `json:"source"`
	Date          time.Time `json:"date"`
	PaymentMethod string    `json:"payment_method"`
}

// Allowed Sources
const (
	SourceSalario      = "Salario"
	SourceFreelance    = "Freelance"
	SourceInversiones  = "Inversiones"
	SourceRegalo       = "Regalo"
	SourceOtros        = "Otros"
)
