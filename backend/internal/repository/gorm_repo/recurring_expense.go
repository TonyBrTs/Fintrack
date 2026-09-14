package gorm_repo

import (
	"context"
	"errors"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"gorm.io/gorm"
)

type GormRecurringExpenseRepository struct {
	db *gorm.DB
}

func NewGormRecurringExpenseRepository(db *gorm.DB) repository.RecurringExpenseRepository {
	return &GormRecurringExpenseRepository{db: db}
}

func (r *GormRecurringExpenseRepository) FindByUserID(ctx context.Context, userID string) ([]models.RecurringExpense, error) {
	var items []models.RecurringExpense
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("is_active desc, next_due_date asc").
		Find(&items).Error
	return items, err
}

func (r *GormRecurringExpenseRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringExpense, error) {
	var item models.RecurringExpense
	err := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *GormRecurringExpenseRepository) FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringExpense, error) {
	var items []models.RecurringExpense
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_active = ? AND next_due_date <= ?", userID, true, until).
		Find(&items).Error
	return items, err
}

func (r *GormRecurringExpenseRepository) FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringExpense, error) {
	var items []models.RecurringExpense
	err := r.db.WithContext(ctx).
		Where("is_active = ? AND next_due_date <= ?", true, until).
		Find(&items).Error
	return items, err
}

func (r *GormRecurringExpenseRepository) Create(ctx context.Context, recurring *models.RecurringExpense) error {
	return r.db.WithContext(ctx).Create(recurring).Error
}

func (r *GormRecurringExpenseRepository) Update(ctx context.Context, id, userID string, recurring *models.RecurringExpense) (*models.RecurringExpense, error) {
	result := r.db.WithContext(ctx).Model(&models.RecurringExpense{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"description":      recurring.Description,
			"amount":           recurring.Amount,
			"currency":         recurring.Currency,
			"category":         recurring.Category,
			"payment_method":   recurring.PaymentMethod,
			"frequency":        recurring.Frequency,
			"biweekly_type":    recurring.BiweeklyType,
			"billing_day":      recurring.BillingDay,
			"start_date":       recurring.StartDate,
			"end_date":         recurring.EndDate,
			"next_due_date":    recurring.NextDueDate,
			"last_executed_at": recurring.LastExecutedAt,
			"is_active":        recurring.IsActive,
			"auto_register":    recurring.AutoRegister,
		})

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("recurring expense not found or unauthorized")
	}

	recurring.ID = id
	recurring.UserID = userID
	return recurring, nil
}

func (r *GormRecurringExpenseRepository) Delete(ctx context.Context, id, userID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.RecurringExpense{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("recurring expense not found or unauthorized")
	}
	return nil
}
