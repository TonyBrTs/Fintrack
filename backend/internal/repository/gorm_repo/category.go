package gorm_repo

import (
	"context"
	"strings"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"gorm.io/gorm"
)

type GormCategoryRepository struct {
	db *gorm.DB
}

func NewGormCategoryRepository(db *gorm.DB) repository.CategoryRepository {
	return &GormCategoryRepository{db: db}
}

func (r *GormCategoryRepository) FindByUserID(ctx context.Context, userID, catType string) ([]models.Category, error) {
	var categories []models.Category
	query := r.db.WithContext(ctx).Where("user_id = ?", userID)
	if catType != "" {
		query = query.Where("type = ?", catType)
	}
	err := query.Order("created_at asc").Find(&categories).Error
	return categories, err
}

func (r *GormCategoryRepository) FindByNameAndType(ctx context.Context, userID, name, catType string) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND LOWER(name) = ? AND type = ?", userID, strings.ToLower(name), catType).
		First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *GormCategoryRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *GormCategoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *GormCategoryRepository) Delete(ctx context.Context, id, userID string) error {
	return r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.Category{}).Error
}
