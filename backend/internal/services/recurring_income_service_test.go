package services_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

type MockRecurringIncomeRepository struct {
	items    []models.RecurringIncome
	errToRet error
}

func (m *MockRecurringIncomeRepository) FindByUserID(ctx context.Context, userID string) ([]models.RecurringIncome, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.RecurringIncome
	for _, item := range m.items {
		if item.UserID == userID {
			res = append(res, item)
		}
	}
	return res, nil
}

func (m *MockRecurringIncomeRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringIncome, error) {
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

func (m *MockRecurringIncomeRepository) FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringIncome, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.RecurringIncome
	for _, item := range m.items {
		if item.UserID == userID && item.IsActive && !item.NextDueDate.After(until) {
			res = append(res, item)
		}
	}
	return res, nil
}

func (m *MockRecurringIncomeRepository) FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringIncome, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.RecurringIncome
	for _, item := range m.items {
		if item.IsActive && !item.NextDueDate.After(until) {
			res = append(res, item)
		}
	}
	return res, nil
}

func (m *MockRecurringIncomeRepository) Create(ctx context.Context, recurring *models.RecurringIncome) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	m.items = append(m.items, *recurring)
	return nil
}

func (m *MockRecurringIncomeRepository) Update(ctx context.Context, id, userID string, recurring *models.RecurringIncome) (*models.RecurringIncome, error) {
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

func (m *MockRecurringIncomeRepository) Delete(ctx context.Context, id, userID string) error {
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

func TestRecurringIncomeService_CreateValidation(t *testing.T) {
	mockRecurring := &MockRecurringIncomeRepository{}
	mockIncome := &MockIncomeRepository{}
	svc := services.NewRecurringIncomeService(mockRecurring, mockIncome)

	ctx := context.Background()

	// Validation: amount <= 0
	_, err := svc.CreateRecurringIncome(ctx, "user-1", &models.RecurringIncome{
		Description: "Salario",
		Amount:      0,
	})
	if err == nil {
		t.Error("expected error for amount <= 0, got nil")
	}

	// Validation: empty description
	_, err = svc.CreateRecurringIncome(ctx, "user-1", &models.RecurringIncome{
		Description: "",
		Amount:      1000,
	})
	if err == nil {
		t.Error("expected error for empty description, got nil")
	}

	// Success with defaults
	created, err := svc.CreateRecurringIncome(ctx, "user-1", &models.RecurringIncome{
		Description: "Nómina Quincenal",
		Amount:      1500,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if created.Source != "Salario" {
		t.Errorf("expected default source 'Salario', got '%s'", created.Source)
	}
	if created.Frequency != models.FrequencyBiweekly {
		t.Errorf("expected default frequency 'biweekly', got '%s'", created.Frequency)
	}
}

func TestRecurringIncomeService_ProcessDueIncomes(t *testing.T) {
	mockRecurring := &MockRecurringIncomeRepository{}
	mockIncome := &MockIncomeRepository{}
	svc := services.NewRecurringIncomeService(mockRecurring, mockIncome)

	ctx := context.Background()
	userID := "user-quincena-income"

	pastDate := time.Now().UTC().AddDate(0, 0, -1)
	rule := models.RecurringIncome{
		ID:            "inc-rule-1",
		UserID:        userID,
		Description:   "Salario de Quincena",
		Amount:        950000,
		Currency:      "CRC",
		Source:        "Salario",
		PaymentMethod: "Transferencia",
		Frequency:     models.FrequencyBiweekly,
		BiweeklyType:  models.Biweekly15AndLast,
		NextDueDate:   pastDate,
		IsActive:      true,
		AutoRegister:  true,
	}
	_ = mockRecurring.Create(ctx, &rule)

	created, err := svc.ProcessDueIncomes(ctx, userID)
	if err != nil {
		t.Fatalf("unexpected error processing due incomes: %v", err)
	}

	if len(created) < 1 {
		t.Fatalf("expected at least 1 created income, got %d", len(created))
	}

	if created[0].Description != "[Recurrente] Salario de Quincena" {
		t.Errorf("expected description '[Recurrente] Salario de Quincena', got '%s'", created[0].Description)
	}
	if created[0].Amount != 950000 {
		t.Errorf("expected amount 950000, got %f", created[0].Amount)
	}

	// Verify next due date advanced
	updated, _ := mockRecurring.FindByIDAndUserID(ctx, "inc-rule-1", userID)
	if !updated.NextDueDate.After(pastDate) {
		t.Errorf("expected next due date to advance past %v, got %v", pastDate, updated.NextDueDate)
	}
}

func TestRecurringIncomeService_ExecuteNow(t *testing.T) {
	mockRecurring := &MockRecurringIncomeRepository{}
	mockIncome := &MockIncomeRepository{}
	svc := services.NewRecurringIncomeService(mockRecurring, mockIncome)

	ctx := context.Background()
	userID := "user-now"

	futureDate := time.Now().UTC().AddDate(0, 0, 10)
	rule := models.RecurringIncome{
		ID:            "rule-ahead",
		UserID:        userID,
		Description:   "Cobro Freelance",
		Amount:        600,
		Currency:      "USD",
		Source:        "Freelance",
		PaymentMethod: "Transferencia",
		Frequency:     models.FrequencyMonthly,
		BillingDay:    15,
		NextDueDate:   futureDate,
		IsActive:      true,
		AutoRegister:  true,
	}
	_ = mockRecurring.Create(ctx, &rule)

	nowIncome, err := svc.ExecuteNow(ctx, "rule-ahead", userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if nowIncome.Amount != 600 {
		t.Errorf("expected 600, got %f", nowIncome.Amount)
	}
	if nowIncome.Description != "[Recurrente] Cobro Freelance" {
		t.Errorf("expected '[Recurrente] Cobro Freelance', got %s", nowIncome.Description)
	}

	// Second execution in the same cycle must fail
	_, err = svc.ExecuteNow(ctx, "rule-ahead", userID)
	if err == nil {
		t.Fatal("expected error on duplicate execution in same cycle, got nil")
	}
}
