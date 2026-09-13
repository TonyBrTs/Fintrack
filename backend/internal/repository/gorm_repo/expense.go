package gorm_repo

import (
	"context"
	"errors"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"gorm.io/gorm"
)

type GormExpenseRepository struct {
	db *gorm.DB
}

func NewGormExpenseRepository(db *gorm.DB) repository.ExpenseRepository {
	return &GormExpenseRepository{db: db}
}

func (r *GormExpenseRepository) FindByUserID(ctx context.Context, userID string) ([]models.Expense, error) {
	var expenses []models.Expense
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("date desc").
		Find(&expenses).Error
	return expenses, err
}

func (r *GormExpenseRepository) Create(ctx context.Context, expense *models.Expense) error {
	return r.db.WithContext(ctx).Create(expense).Error
}

func (r *GormExpenseRepository) Update(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error) {
	result := r.db.WithContext(ctx).Model(&models.Expense{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"amount":         expense.Amount,
			"currency":       expense.Currency,
			"description":    expense.Description,
			"category":       expense.Category,
			"payment_method": expense.PaymentMethod,
			"date":           expense.Date,
		})

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("expense not found or unauthorized")
	}

	expense.ID = id
	expense.UserID = userID
	return expense, nil
}

func (r *GormExpenseRepository) Delete(ctx context.Context, id, userID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.Expense{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("expense not found or unauthorized")
	}
	return nil
}

func (r *GormExpenseRepository) CountByCategory(ctx context.Context, userID, category string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Expense{}).
		Where("user_id = ? AND category = ?", userID, category).
		Count(&count).Error
	return count, err
}

func (r *GormExpenseRepository) ReassignCategory(ctx context.Context, userID, oldCategory, newCategory string) error {
	return r.db.WithContext(ctx).
		Model(&models.Expense{}).
		Where("user_id = ? AND category = ?", userID, oldCategory).
		Update("category", newCategory).Error
}
