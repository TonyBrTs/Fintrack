package models

import "time"

// Income represents a financial income.
type Income struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	UserID        string    `json:"user_id" gorm:"type:uuid;not null;index"`
	Amount        float64   `json:"amount" gorm:"type:numeric(12,2);not null"`
	Currency      string    `json:"currency" gorm:"type:varchar(10);default:'USD'"`
	Description   string    `json:"description" gorm:"type:text;not null"`
	Source          string    `json:"source" gorm:"type:varchar(100);not null;index"`
	SourceID        string    `json:"source_id,omitempty" gorm:"-"`
	Date            time.Time `json:"date" gorm:"type:timestamptz;not null"`
	PaymentMethod   string    `json:"payment_method" gorm:"type:varchar(100);not null"`
	PaymentMethodID string    `json:"payment_method_id,omitempty" gorm:"-"`
	CreatedAt       time.Time `json:"created_at,omitempty" gorm:"type:timestamptz;autoCreateTime"`
}

// Allowed Sources
const (
	SourceSalario     = "Salario"
	SourceFreelance   = "Freelance"
	SourceInversiones = "Inversiones"
	SourceRegalo      = "Regalo"
	SourceOtros       = "Otros"
)
