package gorm_repo

import (
	"context"
	"errors"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"gorm.io/gorm"
)

type GormRecurringIncomeRepository struct {
	db *gorm.DB
}

func NewGormRecurringIncomeRepository(db *gorm.DB) repository.RecurringIncomeRepository {
	return &GormRecurringIncomeRepository{db: db}
}

func (r *GormRecurringIncomeRepository) FindByUserID(ctx context.Context, userID string) ([]models.RecurringIncome, error) {
	var items []models.RecurringIncome
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("is_active desc, next_due_date asc").
		Find(&items).Error
	return items, err
}

func (r *GormRecurringIncomeRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringIncome, error) {
	var item models.RecurringIncome
	err := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *GormRecurringIncomeRepository) FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringIncome, error) {
	var items []models.RecurringIncome
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_active = ? AND next_due_date <= ?", userID, true, until).
		Find(&items).Error
	return items, err
}

func (r *GormRecurringIncomeRepository) FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringIncome, error) {
	var items []models.RecurringIncome
	err := r.db.WithContext(ctx).
		Where("is_active = ? AND next_due_date <= ?", true, until).
		Find(&items).Error
	return items, err
}

func (r *GormRecurringIncomeRepository) Create(ctx context.Context, recurring *models.RecurringIncome) error {
	return r.db.WithContext(ctx).Create(recurring).Error
}

func (r *GormRecurringIncomeRepository) Update(ctx context.Context, id, userID string, recurring *models.RecurringIncome) (*models.RecurringIncome, error) {
	result := r.db.WithContext(ctx).Model(&models.RecurringIncome{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"description":      recurring.Description,
			"amount":           recurring.Amount,
			"currency":         recurring.Currency,
			"source":           recurring.Source,
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
		return nil, errors.New("recurring income not found or unauthorized")
	}

	recurring.ID = id
	recurring.UserID = userID
	return recurring, nil
}

func (r *GormRecurringIncomeRepository) Delete(ctx context.Context, id, userID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.RecurringIncome{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("recurring income not found or unauthorized")
	}
	return nil
}
