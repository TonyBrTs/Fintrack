package services

import (
	"context"

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
