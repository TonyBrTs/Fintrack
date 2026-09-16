package services_test

import (
	"context"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

type mockRecurringExpenseService struct {
	processedCount int
	errToReturn    error
}

func (m *mockRecurringExpenseService) GetRecurringExpenses(ctx context.Context, userID string) ([]models.RecurringExpense, error) {
	return nil, nil
}
func (m *mockRecurringExpenseService) GetRecurringExpenseByID(ctx context.Context, id, userID string) (*models.RecurringExpense, error) {
	return nil, nil
}
func (m *mockRecurringExpenseService) CreateRecurringExpense(ctx context.Context, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error) {
	return nil, nil
}
func (m *mockRecurringExpenseService) UpdateRecurringExpense(ctx context.Context, id, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error) {
	return nil, nil
}
func (m *mockRecurringExpenseService) DeleteRecurringExpense(ctx context.Context, id, userID string) error {
	return nil
}
func (m *mockRecurringExpenseService) ProcessDueExpenses(ctx context.Context, userID string, clientDate ...time.Time) ([]models.Expense, error) {
	return nil, nil
}
func (m *mockRecurringExpenseService) ProcessAllDueExpenses(ctx context.Context) (int, error) {
	return m.processedCount, m.errToReturn
}
func (m *mockRecurringExpenseService) ExecuteNow(ctx context.Context, id, userID string) (*models.Expense, error) {
	return nil, nil
}

type mockRecurringIncomeService struct {
	processedCount int
	errToReturn    error
}

func (m *mockRecurringIncomeService) GetRecurringIncomes(ctx context.Context, userID string) ([]models.RecurringIncome, error) {
	return nil, nil
}
func (m *mockRecurringIncomeService) GetRecurringIncomeByID(ctx context.Context, id, userID string) (*models.RecurringIncome, error) {
	return nil, nil
}
func (m *mockRecurringIncomeService) CreateRecurringIncome(ctx context.Context, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error) {
	return nil, nil
}
func (m *mockRecurringIncomeService) UpdateRecurringIncome(ctx context.Context, id, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error) {
	return nil, nil
}
func (m *mockRecurringIncomeService) DeleteRecurringIncome(ctx context.Context, id, userID string) error {
	return nil
}
func (m *mockRecurringIncomeService) ProcessDueIncomes(ctx context.Context, userID string, clientDate ...time.Time) ([]models.Income, error) {
	return nil, nil
}
func (m *mockRecurringIncomeService) ProcessAllDueIncomes(ctx context.Context) (int, error) {
	return m.processedCount, m.errToReturn
}
func (m *mockRecurringIncomeService) ExecuteNow(ctx context.Context, id, userID string) (*models.Income, error) {
	return nil, nil
}

func TestRecurringScheduler_Lifecycle(t *testing.T) {
	mockExp := &mockRecurringExpenseService{processedCount: 2}
	mockInc := &mockRecurringIncomeService{processedCount: 1}

	scheduler := services.NewRecurringScheduler(mockExp, mockInc, 10*time.Millisecond)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	scheduler.Start(ctx)

	// Wait for at least one cycle
	time.Sleep(35 * time.Millisecond)

	// Test graceful shutdown
	scheduler.Stop()
	// Multiple Stop calls should be safe (sync.Once)
	scheduler.Stop()
}