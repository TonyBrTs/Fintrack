package models

import "time"

// APIKey represents a secure user-generated API key for integrations such as n8n, webhooks, or automation scripts.
type APIKey struct {
	ID         string     `json:"id" gorm:"primaryKey"`
	UserID     string     `json:"user_id" gorm:"type:uuid;not null;index"`
	Name       string     `json:"name" gorm:"type:varchar(100);not null"`
	KeyHash    string     `json:"-" gorm:"type:varchar(64);uniqueIndex;not null"`
	KeyPrefix  string     `json:"key_prefix" gorm:"type:varchar(20);not null"` // e.g. "fntk_live_"
	KeyLast4   string     `json:"key_last4" gorm:"type:varchar(4);not null"`   // e.g. "a9f2"
	CreatedAt  time.Time  `json:"created_at" gorm:"type:timestamptz;autoCreateTime"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty" gorm:"type:timestamptz"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty" gorm:"type:timestamptz"`
	IsActive   bool       `json:"is_active" gorm:"default:true;index"`
}

// CreateAPIKeyResponse includes the raw secret token ONLY ONCE upon creation.
type CreateAPIKeyResponse struct {
	APIKey
	PlainKey string `json:"plain_key"` // Shown only once in the UI modal!
}

// CreateAPIKeyInput is the request body to generate an API key.
type CreateAPIKeyInput struct {
	Name string `json:"name" binding:"required"`
}
