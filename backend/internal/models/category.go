package models

import "time"

// Category represents a customized or system category for expenses or incomes.
type Category struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"type:varchar(100);not null"`
	Type      string    `json:"type" gorm:"type:varchar(20);not null;default:'expense'"` // 'expense' or 'income'
	Color     string    `json:"color" gorm:"type:varchar(50);default:'blue'"`
	Icon      string    `json:"icon" gorm:"type:varchar(50);default:'tag'"`
	CreatedAt time.Time `json:"created_at,omitempty" gorm:"type:timestamptz;autoCreateTime"`
}

// CategoryResponse represents the JSON returned to the client, including system flag.
type CategoryResponse struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id,omitempty"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Color     string    `json:"color"`
	Icon      string    `json:"icon"`
	IsDefault bool      `json:"is_default"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

// Default system expense categories
var DefaultExpenseCategories = []CategoryResponse{
	{ID: "default-exp-1", Name: "Alimentación", Type: "expense", Color: "emerald", Icon: "utensils", IsDefault: true},
	{ID: "default-exp-2", Name: "Transporte", Type: "expense", Color: "blue", Icon: "car", IsDefault: true},
	{ID: "default-exp-3", Name: "Servicios", Type: "expense", Color: "amber", Icon: "zap", IsDefault: true},
	{ID: "default-exp-4", Name: "Entretenimiento", Type: "expense", Color: "purple", Icon: "film", IsDefault: true},
	{ID: "default-exp-5", Name: "Salud", Type: "expense", Color: "rose", Icon: "heart-pulse", IsDefault: true},
	{ID: "default-exp-6", Name: "Metas", Type: "expense", Color: "cyan", Icon: "target", IsDefault: true},
	{ID: "default-exp-7", Name: "Otros", Type: "expense", Color: "slate", Icon: "more-horizontal", IsDefault: true},
}

// Default system income sources
var DefaultIncomeSources = []CategoryResponse{
	{ID: "default-inc-1", Name: "Salario", Type: "income", Color: "emerald", Icon: "briefcase", IsDefault: true},
	{ID: "default-inc-2", Name: "Freelance", Type: "income", Color: "blue", Icon: "laptop", IsDefault: true},
	{ID: "default-inc-3", Name: "Inversiones", Type: "income", Color: "purple", Icon: "trending-up", IsDefault: true},
	{ID: "default-inc-4", Name: "Regalo", Type: "income", Color: "pink", Icon: "gift", IsDefault: true},
	{ID: "default-inc-5", Name: "Otros", Type: "income", Color: "slate", Icon: "more-horizontal", IsDefault: true},
}
