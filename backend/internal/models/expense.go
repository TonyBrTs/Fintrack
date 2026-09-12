package models

import "time"

// Expense represents a financial expense.
type Expense struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	UserID        string    `json:"user_id" gorm:"type:uuid;not null;index"`
	Amount        float64   `json:"amount" gorm:"type:numeric(12,2);not null"`
	Currency      string    `json:"currency" gorm:"type:varchar(10);default:'USD'"`
	Description   string    `json:"description" gorm:"type:text;not null"`
	Category      string    `json:"category" gorm:"type:varchar(100);not null;index"`
	Date          time.Time `json:"date" gorm:"type:timestamptz;not null"`
	PaymentMethod string    `json:"payment_method" gorm:"type:varchar(100);not null"`
	CreatedAt     time.Time `json:"created_at,omitempty" gorm:"type:timestamptz;autoCreateTime"`
}

// Allowed Categories
const (
	CategoryAlimentacion    = "Alimentación"
	CategoryTransporte     = "Transporte"
	CategoryServicios      = "Servicios"
	CategoryEntretenimiento = "Entretenimiento"
	CategorySalud          = "Salud"
	CategoryOtros          = "Otros"
)
