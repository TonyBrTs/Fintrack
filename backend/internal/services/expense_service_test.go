package services_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

// MockExpenseRepository implements repository.ExpenseRepository for unit testing.
type MockExpenseRepository struct {
	expenses []models.Expense
	errToRet error
}

func (m *MockExpenseRepository) FindByUserID(ctx context.Context, userID string) ([]models.Expense, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.Expense
	for _, e := range m.expenses {
		if e.UserID == userID {
			res = append(res, e)
		}
	}
	return res, nil
}

func (m *MockExpenseRepository) Create(ctx context.Context, expense *models.Expense) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	m.expenses = append(m.expenses, *expense)
	return nil
}

func (m *MockExpenseRepository) Update(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	for i, e := range m.expenses {
		if e.ID == id && e.UserID == userID {
			m.expenses[i] = *expense
			return expense, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *MockExpenseRepository) Delete(ctx context.Context, id, userID string) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	for i, e := range m.expenses {
		if e.ID == id && e.UserID == userID {
			m.expenses = append(m.expenses[:i], m.expenses[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func (m *MockExpenseRepository) CountByCategory(ctx context.Context, userID, category string) (int64, error) {
	var c int64
	for _, e := range m.expenses {
		if e.UserID == userID && e.Category == category {
			c++
		}
	}
	return c, nil
}

func (m *MockExpenseRepository) ReassignCategory(ctx context.Context, userID, oldCategory, newCategory string) error {
	for i, e := range m.expenses {
		if e.UserID == userID && e.Category == oldCategory {
			m.expenses[i].Category = newCategory
		}
	}
	return nil
}

func TestExpenseService_CreateAndGet(t *testing.T) {
	mockRepo := &MockExpenseRepository{}
	svc := services.NewExpenseService(mockRepo)

	ctx := context.Background()
	userID := "user-uuid-123"

	newExp := &models.Expense{
		Amount:        45.50,
		Currency:      "USD",
		Description:   "Almuerzo corporativo",
		Category:      "Alimentación",
		PaymentMethod: "Tarjeta de Débito",
		Date:          time.Now(),
	}

	created, err := svc.CreateExpense(ctx, userID, newExp)
	if err != nil {
		t.Fatalf("unexpected error creating expense: %v", err)
	}

	if created.ID == "" {
		t.Errorf("expected ID to be generated, got empty")
	}
	if created.UserID != userID {
		t.Errorf("expected UserID %s, got %s", userID, created.UserID)
	}

	list, err := svc.GetExpenses(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error getting expenses: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 expense, got %d", len(list))
	}
	if list[0].Description != "Almuerzo corporativo" {
		t.Errorf("expected description 'Almuerzo corporativo', got '%s'", list[0].Description)
	}
}
