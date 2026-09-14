package models

import "time"

// Frequencies for recurring expenses
const (
	FrequencyBiweekly = "biweekly" // Quincenal (ej. días 15 y fin de mes)
	FrequencyMonthly  = "monthly"  // Mensual (día específico del mes)
	FrequencyWeekly   = "weekly"   // Semanal
	FrequencyYearly   = "yearly"   // Anual

	Biweekly15AndLast   = "15_and_last_day" // Días 15 y último día del mes
	BiweeklyEvery15Days = "every_15_days"    // Cada 15 días exactos
)

// RecurringExpense represents a scheduled fixed or recurring expense.
type RecurringExpense struct {
	ID             string     `json:"id" gorm:"primaryKey"`
	UserID         string     `json:"user_id" gorm:"type:uuid;not null;index"`
	Description    string     `json:"description" gorm:"type:text;not null"`
	Amount         float64    `json:"amount" gorm:"type:numeric(12,2);not null"`
	Currency       string     `json:"currency" gorm:"type:varchar(10);default:'USD'"`
	Category       string     `json:"category" gorm:"type:varchar(100);not null;index"`
	PaymentMethod  string     `json:"payment_method" gorm:"type:varchar(100);not null"`
	Frequency      string     `json:"frequency" gorm:"type:varchar(20);not null;default:'biweekly'"`
	BiweeklyType   string     `json:"biweekly_type" gorm:"type:varchar(30);default:'15_and_last_day'"`
	BillingDay     int        `json:"billing_day" gorm:"type:int;default:15"`
	StartDate      time.Time  `json:"start_date" gorm:"type:timestamptz;not null"`
	EndDate        *time.Time `json:"end_date,omitempty" gorm:"type:timestamptz"`
	NextDueDate    time.Time  `json:"next_due_date" gorm:"type:timestamptz;not null;index"`
	LastExecutedAt *time.Time `json:"last_executed_at,omitempty" gorm:"type:timestamptz"`
	IsActive       bool       `json:"is_active" gorm:"type:boolean;default:true;index"`
	AutoRegister   bool       `json:"auto_register" gorm:"type:boolean;default:true"`
	CreatedAt      time.Time  `json:"created_at,omitempty" gorm:"type:timestamptz;autoCreateTime"`
	UpdatedAt      time.Time  `json:"updated_at,omitempty" gorm:"type:timestamptz;autoUpdateTime"`
}
