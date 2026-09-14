package models

import "time"

// RecurringIncome represents a scheduled fixed or recurring income (salary, freelance retainer, rentals, etc.).
type RecurringIncome struct {
	ID             string     `json:"id" gorm:"primaryKey"`
	UserID         string     `json:"user_id" gorm:"type:uuid;not null;index"`
	Description    string     `json:"description" gorm:"type:text;not null"`
	Amount         float64    `json:"amount" gorm:"type:numeric(12,2);not null"`
	Currency       string     `json:"currency" gorm:"type:varchar(10);default:'USD'"`
	Source         string     `json:"source" gorm:"type:varchar(100);not null;index"`
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
