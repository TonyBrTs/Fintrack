package gorm_repo

import (
	"context"
	"errors"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"gorm.io/gorm"
)

type GormAPIKeyRepository struct {
	db *gorm.DB
}

func NewGormAPIKeyRepository(db *gorm.DB) repository.APIKeyRepository {
	return &GormAPIKeyRepository{db: db}
}

func (r *GormAPIKeyRepository) FindByUserID(ctx context.Context, userID string) ([]models.APIKey, error) {
	var keys []models.APIKey
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&keys).Error
	return keys, err
}

func (r *GormAPIKeyRepository) FindByHash(ctx context.Context, keyHash string) (*models.APIKey, error) {
	var key models.APIKey
	err := r.db.WithContext(ctx).
		Where("key_hash = ? AND is_active = ?", keyHash, true).
		First(&key).Error
	if err != nil {
		return nil, err
	}
	return &key, nil
}

func (r *GormAPIKeyRepository) Create(ctx context.Context, key *models.APIKey) error {
	return r.db.WithContext(ctx).Create(key).Error
}

func (r *GormAPIKeyRepository) Delete(ctx context.Context, id, userID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.APIKey{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("api key not found or unauthorized")
	}
	return nil
}

func (r *GormAPIKeyRepository) UpdateLastUsed(ctx context.Context, id string, lastUsed time.Time) error {
	return r.db.WithContext(ctx).
		Model(&models.APIKey{}).
		Where("id = ?", id).
		Update("last_used_at", lastUsed).Error
}
