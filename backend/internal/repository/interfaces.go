package repository

import (
	"context"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
)

// ExpenseRepository defines persistence operations for expenses.
type ExpenseRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]models.Expense, error)
	Create(ctx context.Context, expense *models.Expense) error
	Update(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error)
	Delete(ctx context.Context, id, userID string) error
	CountByCategory(ctx context.Context, userID, category string) (int64, error)
	ReassignCategory(ctx context.Context, userID, oldCategory, newCategory string) error
}

// IncomeRepository defines persistence operations for incomes.
type IncomeRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]models.Income, error)
	Create(ctx context.Context, income *models.Income) error
	Update(ctx context.Context, id, userID string, income *models.Income) (*models.Income, error)
	Delete(ctx context.Context, id, userID string) error
	CountBySource(ctx context.Context, userID, source string) (int64, error)
	ReassignSource(ctx context.Context, userID, oldSource, newSource string) error
}

// GoalRepository defines persistence operations for savings goals.
type GoalRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]models.Goal, error)
	Create(ctx context.Context, goal *models.Goal) error
	Update(ctx context.Context, id, userID string, goal *models.Goal) (*models.Goal, error)
	Delete(ctx context.Context, id, userID string) error
}

// CategoryRepository defines persistence operations for custom categories.
type CategoryRepository interface {
	FindByUserID(ctx context.Context, userID, catType string) ([]models.Category, error)
	FindByNameAndType(ctx context.Context, userID, name, catType string) (*models.Category, error)
	FindByIDAndUserID(ctx context.Context, id, userID string) (*models.Category, error)
	Create(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id, userID string) error
}

// RecurringExpenseRepository defines persistence operations for recurring/fixed expenses.
type RecurringExpenseRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]models.RecurringExpense, error)
	FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringExpense, error)
	FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringExpense, error)
	FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringExpense, error)
	Create(ctx context.Context, recurring *models.RecurringExpense) error
	Update(ctx context.Context, id, userID string, recurring *models.RecurringExpense) (*models.RecurringExpense, error)
	Delete(ctx context.Context, id, userID string) error
}

// RecurringIncomeRepository defines persistence operations for recurring/fixed incomes.
type RecurringIncomeRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]models.RecurringIncome, error)
	FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringIncome, error)
	FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringIncome, error)
	FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringIncome, error)
	Create(ctx context.Context, recurring *models.RecurringIncome) error
	Update(ctx context.Context, id, userID string, recurring *models.RecurringIncome) (*models.RecurringIncome, error)
	Delete(ctx context.Context, id, userID string) error
}
