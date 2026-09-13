package services_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

// MockIncomeRepository implements repository.IncomeRepository for unit testing.
type MockIncomeRepository struct {
	incomes  []models.Income
	errToRet error
}

func (m *MockIncomeRepository) FindByUserID(ctx context.Context, userID string) ([]models.Income, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.Income
	for _, inc := range m.incomes {
		if inc.UserID == userID {
			res = append(res, inc)
		}
	}
	return res, nil
}

func (m *MockIncomeRepository) Create(ctx context.Context, income *models.Income) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	m.incomes = append(m.incomes, *income)
	return nil
}

func (m *MockIncomeRepository) Update(ctx context.Context, id, userID string, income *models.Income) (*models.Income, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	for i, inc := range m.incomes {
		if inc.ID == id && inc.UserID == userID {
			m.incomes[i] = *income
			return income, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *MockIncomeRepository) Delete(ctx context.Context, id, userID string) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	for i, inc := range m.incomes {
		if inc.ID == id && inc.UserID == userID {
			m.incomes = append(m.incomes[:i], m.incomes[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func (m *MockIncomeRepository) CountBySource(ctx context.Context, userID, source string) (int64, error) {
	var count int64
	for _, inc := range m.incomes {
		if inc.UserID == userID && inc.Source == source {
			count++
		}
	}
	return count, nil
}

func (m *MockIncomeRepository) ReassignSource(ctx context.Context, userID, oldSource, newSource string) error {
	for i, inc := range m.incomes {
		if inc.UserID == userID && inc.Source == oldSource {
			m.incomes[i].Source = newSource
		}
	}
	return nil
}

func TestIncomeService_CreateAndGet(t *testing.T) {
	mockRepo := &MockIncomeRepository{}
	svc := services.NewIncomeService(mockRepo)

	ctx := context.Background()
	userID := "user-income-test-1"

	newInc := &models.Income{
		Amount:      1250.00,
		Currency:    "USD",
		Source:      "Nómina Quincenal",
		Description: "Pago quincena",
		Date:        time.Now(),
	}

	created, err := svc.CreateIncome(ctx, userID, newInc)
	if err != nil {
		t.Fatalf("expected nil error, got: %v", err)
	}
	if created.ID == "" {
		t.Errorf("expected auto-generated ID, got empty string")
	}
	if created.UserID != userID {
		t.Errorf("expected userID %s, got: %s", userID, created.UserID)
	}

	incomes, err := svc.GetIncomes(ctx, userID)
	if err != nil {
		t.Fatalf("failed to get incomes: %v", err)
	}
	if len(incomes) != 1 {
		t.Fatalf("expected 1 income, got: %d", len(incomes))
	}
	if incomes[0].Amount != 1250.00 {
		t.Errorf("expected amount 1250.00, got: %f", incomes[0].Amount)
	}
}

func TestIncomeService_Update(t *testing.T) {
	mockRepo := &MockIncomeRepository{}
	svc := services.NewIncomeService(mockRepo)

	ctx := context.Background()
	userID := "user-income-test-2"

	created, _ := svc.CreateIncome(ctx, userID, &models.Income{
		Amount:   500.00,
		Currency: "USD",
		Source:   "Freelance",
	})

	updatePayload := &models.Income{
		ID:       created.ID,
		UserID:   userID,
		Amount:   750.00,
		Currency: "USD",
		Source:   "Freelance Proyecto Extra",
	}

	updated, err := svc.UpdateIncome(ctx, created.ID, userID, updatePayload)
	if err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if updated.Amount != 750.00 {
		t.Errorf("expected updated amount 750.00, got %f", updated.Amount)
	}
}

func TestIncomeService_Delete(t *testing.T) {
	mockRepo := &MockIncomeRepository{}
	svc := services.NewIncomeService(mockRepo)

	ctx := context.Background()
	userID := "user-income-test-3"

	created, _ := svc.CreateIncome(ctx, userID, &models.Income{
		Amount: 200.00,
		Source: "Intereses",
	})

	if err := svc.DeleteIncome(ctx, created.ID, userID); err != nil {
		t.Fatalf("delete failed: %v", err)
	}

	list, _ := svc.GetIncomes(ctx, userID)
	if len(list) != 0 {
		t.Errorf("expected 0 incomes after delete, got %d", len(list))
	}
}

func TestIncomeService_ErrorPropagation(t *testing.T) {
	dbErr := errors.New("database connection failed")
	mockRepo := &MockIncomeRepository{errToRet: dbErr}
	svc := services.NewIncomeService(mockRepo)

	ctx := context.Background()
	_, err := svc.GetIncomes(ctx, "user-err")
	if err != dbErr {
		t.Errorf("expected dbErr, got %v", err)
	}
}
