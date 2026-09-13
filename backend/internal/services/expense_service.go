package services

import (
	"context"
	"fmt"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type expenseService struct {
	repo repository.ExpenseRepository
}

func NewExpenseService(repo repository.ExpenseRepository) ExpenseService {
	return &expenseService{repo: repo}
}

func (s *expenseService) GetExpenses(ctx context.Context, userID string) ([]models.Expense, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *expenseService) CreateExpense(ctx context.Context, userID string, expense *models.Expense) (*models.Expense, error) {
	expense.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	expense.UserID = userID
	if expense.Date.IsZero() {
		expense.Date = time.Now()
	}
	if err := s.repo.Create(ctx, expense); err != nil {
		return nil, err
	}
	return expense, nil
}

func (s *expenseService) UpdateExpense(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error) {
	return s.repo.Update(ctx, id, userID, expense)
}

func (s *expenseService) DeleteExpense(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}
