package services_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

type MockRecurringRepository struct {
	items    []models.RecurringExpense
	errToRet error
}

func (m *MockRecurringRepository) FindByUserID(ctx context.Context, userID string) ([]models.RecurringExpense, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.RecurringExpense
	for _, item := range m.items {
		if item.UserID == userID {
			res = append(res, item)
		}
	}
	return res, nil
}

func (m *MockRecurringRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringExpense, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	for _, item := range m.items {
		if item.ID == id && item.UserID == userID {
			cp := item
			return &cp, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *MockRecurringRepository) FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringExpense, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.RecurringExpense
	for _, item := range m.items {
		if item.UserID == userID && item.IsActive && item.AutoRegister && !item.NextDueDate.After(until) {
			res = append(res, item)
		}
	}
	return res, nil
}

func (m *MockRecurringRepository) FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringExpense, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.RecurringExpense
	for _, item := range m.items {
		if item.IsActive && item.AutoRegister && !item.NextDueDate.After(until) {
			res = append(res, item)
		}
	}
	return res, nil
}

func (m *MockRecurringRepository) Create(ctx context.Context, recurring *models.RecurringExpense) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	m.items = append(m.items, *recurring)
	return nil
}

func (m *MockRecurringRepository) Update(ctx context.Context, id, userID string, recurring *models.RecurringExpense) (*models.RecurringExpense, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	for i, item := range m.items {
		if item.ID == id && item.UserID == userID {
			m.items[i] = *recurring
			return recurring, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *MockRecurringRepository) Delete(ctx context.Context, id, userID string) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	for i, item := range m.items {
		if item.ID == id && item.UserID == userID {
			m.items = append(m.items[:i], m.items[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func TestRecurringExpenseService_BiweeklyDueDateCalculation(t *testing.T) {
	// Jan 5 -> first quincena is Jan 15
	startJan5 := time.Date(2026, 1, 5, 0, 0, 0, 0, time.UTC)
	due1 := services.CalculateInitialDueDate(models.FrequencyBiweekly, models.Biweekly15AndLast, 15, startJan5)
	if due1.Day() != 15 || due1.Month() != 1 {
		t.Errorf("expected Jan 15, got %v", due1)
	}

	// Jan 15 -> next due is Jan 31 (last day of January)
	due2 := services.CalculateNextDueDate(models.FrequencyBiweekly, models.Biweekly15AndLast, 15, due1)
	if due2.Day() != 31 || due2.Month() != 1 {
		t.Errorf("expected Jan 31, got %v", due2)
	}

	// Jan 31 -> next due is Feb 15
	due3 := services.CalculateNextDueDate(models.FrequencyBiweekly, models.Biweekly15AndLast, 15, due2)
	if due3.Day() != 15 || due3.Month() != 2 {
		t.Errorf("expected Feb 15, got %v", due3)
	}

	// Feb 15 in 2026 (non leap) -> next due is Feb 28
	due4 := services.CalculateNextDueDate(models.FrequencyBiweekly, models.Biweekly15AndLast, 15, due3)
	if due4.Day() != 28 || due4.Month() != 2 {
		t.Errorf("expected Feb 28, got %v", due4)
	}
}

func TestRecurringExpenseService_MonthlyDueDateCalculation(t *testing.T) {
	// March 10, billing day 5 -> already passed for March, so next is April 5
	startMarch10 := time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC)
	due := services.CalculateInitialDueDate(models.FrequencyMonthly, "", 5, startMarch10)
	if due.Day() != 5 || due.Month() != 4 {
		t.Errorf("expected April 5, got %v", due)
	}

	// April 5 -> next is May 5
	next := services.CalculateNextDueDate(models.FrequencyMonthly, "", 5, due)
	if next.Day() != 5 || next.Month() != 5 {
		t.Errorf("expected May 5, got %v", next)
	}
}

func TestRecurringExpenseService_ProcessDueExpensesCatchUp(t *testing.T) {
	mockRecurring := &MockRecurringRepository{}
	mockExpense := &MockExpenseRepository{}
	svc := services.NewRecurringExpenseService(mockRecurring, mockExpense)

	ctx := context.Background()
	userID := "test-user-quincena"

	// Create a recurring expense due yesterday
	pastDate := time.Now().UTC().AddDate(0, 0, -2)
	rule := models.RecurringExpense{
		ID:            "rule-1",
		UserID:        userID,
		Description:   "Alquiler de Casa",
		Amount:        350000,
		Currency:      "CRC",
		Category:      "Servicios",
		PaymentMethod: "Transferencia",
		Frequency:     models.FrequencyBiweekly,
		BiweeklyType:  models.Biweekly15AndLast,
		NextDueDate:   pastDate,
		IsActive:      true,
		AutoRegister:  true,
	}
	_ = mockRecurring.Create(ctx, &rule)

	// Process due expenses
	created, err := svc.ProcessDueExpenses(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error processing due expenses: %v", err)
	}

	if len(created) < 1 {
		t.Fatalf("expected at least 1 created expense, got %d", len(created))
	}

	if created[0].Description != "[Recurrente] Alquiler de Casa" {
		t.Errorf("expected description '[Recurrente] Alquiler de Casa', got '%s'", created[0].Description)
	}
	if created[0].Amount != 350000 {
		t.Errorf("expected amount 350000, got %f", created[0].Amount)
	}

	// Verify the rule's NextDueDate has advanced into the future
	updatedRule, _ := mockRecurring.FindByIDAndUserID(ctx, "rule-1", userID)
	if !updatedRule.NextDueDate.After(pastDate) {
		t.Errorf("expected next due date to be advanced past %v, got %v", pastDate, updatedRule.NextDueDate)
	}
}

func TestRecurringExpenseService_ExecuteNow_PreventsCycleDuplicate(t *testing.T) {
	mockRecurring := &MockRecurringRepository{}
	mockExpense := &MockExpenseRepository{}
	svc := services.NewRecurringExpenseService(mockRecurring, mockExpense)

	ctx := context.Background()
	userID := "user-dup-test"

	rule := models.RecurringExpense{
		ID:            "rule-dup",
		UserID:        userID,
		Description:   "Internet Fibra",
		Amount:        35000,
		Currency:      "CRC",
		Category:      "Servicios",
		PaymentMethod: "Transferencia",
		Frequency:     models.FrequencyMonthly,
		BillingDay:    15,
		NextDueDate:   time.Now().UTC().AddDate(0, 0, 5),
		IsActive:      true,
		AutoRegister:  true,
	}
	_ = mockRecurring.Create(ctx, &rule)

	// First execution succeeds
	exp, err := svc.ExecuteNow(ctx, "rule-dup", userID)
	if err != nil {
		t.Fatalf("first execution failed: %v", err)
	}
	if exp.Description != "[Recurrente] Internet Fibra" {
		t.Errorf("expected prefix [Recurrente], got %s", exp.Description)
	}

	// Second execution in the same cycle must fail
	_, err = svc.ExecuteNow(ctx, "rule-dup", userID)
	if err == nil {
		t.Fatal("expected error on second execution in same cycle, got nil")
	}
}
