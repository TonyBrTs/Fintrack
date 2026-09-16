package services

import (
	"context"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
)

// DeleteCategoryResult represents the result of a category deletion.
type DeleteCategoryResult struct {
	Message         string `json:"message"`
	Reassigned      bool   `json:"reassigned"`
	ReassignedTo    string `json:"reassigned_to,omitempty"`
	ReassignedCount int64  `json:"reassigned_count"`
}

// CategoryInUseError represents an error when a category cannot be deleted because it is in use.
type CategoryInUseError struct {
	Count        int64
	CategoryName string
	CategoryType string
}

func (e *CategoryInUseError) Error() string {
	return "category in use"
}

// ExpenseService defines business operations for expenses.
type ExpenseService interface {
	GetExpenses(ctx context.Context, userID string) ([]models.Expense, error)
	CreateExpense(ctx context.Context, userID string, expense *models.Expense) (*models.Expense, error)
	UpdateExpense(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error)
	DeleteExpense(ctx context.Context, id, userID string) error
}

// IncomeService defines business operations for incomes.
type IncomeService interface {
	GetIncomes(ctx context.Context, userID string) ([]models.Income, error)
	CreateIncome(ctx context.Context, userID string, income *models.Income) (*models.Income, error)
	UpdateIncome(ctx context.Context, id, userID string, income *models.Income) (*models.Income, error)
	DeleteIncome(ctx context.Context, id, userID string) error
}

// GoalService defines business operations for goals.
type GoalService interface {
	GetGoals(ctx context.Context, userID string) ([]models.Goal, error)
	CreateGoal(ctx context.Context, userID string, goal *models.Goal) (*models.Goal, error)
	UpdateGoal(ctx context.Context, id, userID string, goal *models.Goal) (*models.Goal, error)
	DeleteGoal(ctx context.Context, id, userID string) error
}

// CategoryService defines business operations for categories.
type CategoryService interface {
	GetCategories(ctx context.Context, userID, catType string) ([]models.CategoryResponse, error)
	CreateCategory(ctx context.Context, userID, name, catType, color, icon string) (*models.CategoryResponse, error)
	DeleteCategory(ctx context.Context, id, userID, reassignTo string) (*DeleteCategoryResult, error)
}

// RecurringExpenseService defines business operations for recurring expenses.
type RecurringExpenseService interface {
	GetRecurringExpenses(ctx context.Context, userID string) ([]models.RecurringExpense, error)
	GetRecurringExpenseByID(ctx context.Context, id, userID string) (*models.RecurringExpense, error)
	CreateRecurringExpense(ctx context.Context, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error)
	UpdateRecurringExpense(ctx context.Context, id, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error)
	DeleteRecurringExpense(ctx context.Context, id, userID string) error
	ProcessDueExpenses(ctx context.Context, userID string, clientDate ...time.Time) ([]models.Expense, error)
	ProcessAllDueExpenses(ctx context.Context) (int, error)
	ExecuteNow(ctx context.Context, id, userID string) (*models.Expense, error)
}

// RecurringIncomeService defines business operations for recurring incomes.
type RecurringIncomeService interface {
	GetRecurringIncomes(ctx context.Context, userID string) ([]models.RecurringIncome, error)
	GetRecurringIncomeByID(ctx context.Context, id, userID string) (*models.RecurringIncome, error)
	CreateRecurringIncome(ctx context.Context, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error)
	UpdateRecurringIncome(ctx context.Context, id, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error)
	DeleteRecurringIncome(ctx context.Context, id, userID string) error
	ProcessDueIncomes(ctx context.Context, userID string, clientDate ...time.Time) ([]models.Income, error)
	ProcessAllDueIncomes(ctx context.Context) (int, error)
	ExecuteNow(ctx context.Context, id, userID string) (*models.Income, error)
}

// Scheduler defines the lifecycle contract for background tasks.
type Scheduler interface {
	Start(ctx context.Context)
	Stop()
}

