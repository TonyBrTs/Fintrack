package gorm_repo

import (
	"context"
	"errors"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"gorm.io/gorm"
)

type GormIncomeRepository struct {
	db *gorm.DB
}

func NewGormIncomeRepository(db *gorm.DB) repository.IncomeRepository {
	return &GormIncomeRepository{db: db}
}

func (r *GormIncomeRepository) FindByUserID(ctx context.Context, userID string) ([]models.Income, error) {
	var incomes []models.Income
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("date desc").
		Find(&incomes).Error
	return incomes, err
}

func (r *GormIncomeRepository) Create(ctx context.Context, income *models.Income) error {
	return r.db.WithContext(ctx).Create(income).Error
}

func (r *GormIncomeRepository) Update(ctx context.Context, id, userID string, income *models.Income) (*models.Income, error) {
	result := r.db.WithContext(ctx).Model(&models.Income{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"amount":         income.Amount,
			"currency":       income.Currency,
			"description":    income.Description,
			"source":         income.Source,
			"payment_method": income.PaymentMethod,
			"date":           income.Date,
		})

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("income not found or unauthorized")
	}

	income.ID = id
	income.UserID = userID
	return income, nil
}

func (r *GormIncomeRepository) Delete(ctx context.Context, id, userID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.Income{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("income not found or unauthorized")
	}
	return nil
}

func (r *GormIncomeRepository) CountBySource(ctx context.Context, userID, source string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Income{}).
		Where("user_id = ? AND source = ?", userID, source).
		Count(&count).Error
	return count, err
}

func (r *GormIncomeRepository) ReassignSource(ctx context.Context, userID, oldSource, newSource string) error {
	return r.db.WithContext(ctx).
		Model(&models.Income{}).
		Where("user_id = ? AND source = ?", userID, oldSource).
		Update("source", newSource).Error
}
