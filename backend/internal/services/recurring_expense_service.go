package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type RecurringExpenseService interface {
	GetRecurringExpenses(ctx context.Context, userID string) ([]models.RecurringExpense, error)
	GetRecurringExpenseByID(ctx context.Context, id, userID string) (*models.RecurringExpense, error)
	CreateRecurringExpense(ctx context.Context, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error)
	UpdateRecurringExpense(ctx context.Context, id, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error)
	DeleteRecurringExpense(ctx context.Context, id, userID string) error
	ProcessDueExpenses(ctx context.Context, userID string) ([]models.Expense, error)
	ProcessAllDueExpenses(ctx context.Context) (int, error)
	ExecuteNow(ctx context.Context, id, userID string) (*models.Expense, error)
}

type recurringExpenseService struct {
	recurringRepo repository.RecurringExpenseRepository
	expenseRepo   repository.ExpenseRepository
}

func NewRecurringExpenseService(
	recurringRepo repository.RecurringExpenseRepository,
	expenseRepo repository.ExpenseRepository,
) RecurringExpenseService {
	return &recurringExpenseService{
		recurringRepo: recurringRepo,
		expenseRepo:   expenseRepo,
	}
}

func (s *recurringExpenseService) GetRecurringExpenses(ctx context.Context, userID string) ([]models.RecurringExpense, error) {
	return s.recurringRepo.FindByUserID(ctx, userID)
}

func (s *recurringExpenseService) GetRecurringExpenseByID(ctx context.Context, id, userID string) (*models.RecurringExpense, error) {
	return s.recurringRepo.FindByIDAndUserID(ctx, id, userID)
}

func (s *recurringExpenseService) CreateRecurringExpense(ctx context.Context, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error) {
	if item.Amount <= 0 {
		return nil, errors.New("el monto debe ser mayor a 0")
	}
	if item.Description == "" {
		return nil, errors.New("la descripción es obligatoria")
	}
	if item.Category == "" {
		item.Category = models.CategoryServicios
	}
	if item.PaymentMethod == "" {
		item.PaymentMethod = "Transferencia"
	}
	if item.Frequency == "" {
		item.Frequency = models.FrequencyBiweekly
	}
	if item.BiweeklyType == "" {
		item.BiweeklyType = models.Biweekly15AndLast
	}
	if item.BillingDay <= 0 || item.BillingDay > 31 {
		item.BillingDay = 15
	}

	item.ID = GenerateShortID("rule_")
	item.UserID = userID
	item.IsActive = true
	item.AutoRegister = true

	now := time.Now().UTC()
	if item.StartDate.IsZero() {
		item.StartDate = now
	}

	// Calculate first NextDueDate based on frequency and StartDate
	if item.NextDueDate.IsZero() {
		item.NextDueDate = CalculateInitialDueDate(item.Frequency, item.BiweeklyType, item.BillingDay, item.StartDate)
	}

	item.CreatedAt = now
	item.UpdatedAt = now

	if err := s.recurringRepo.Create(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *recurringExpenseService) UpdateRecurringExpense(ctx context.Context, id, userID string, item *models.RecurringExpense) (*models.RecurringExpense, error) {
	existing, err := s.recurringRepo.FindByIDAndUserID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	if item.Amount > 0 {
		existing.Amount = item.Amount
	}
	if item.Description != "" {
		existing.Description = item.Description
	}
	if item.Category != "" {
		existing.Category = item.Category
	}
	if item.PaymentMethod != "" {
		existing.PaymentMethod = item.PaymentMethod
	}
	if item.Frequency != "" {
		existing.Frequency = item.Frequency
	}
	if item.BiweeklyType != "" {
		existing.BiweeklyType = item.BiweeklyType
	}
	if item.BillingDay > 0 && item.BillingDay <= 31 {
		existing.BillingDay = item.BillingDay
	}
	if !item.NextDueDate.IsZero() {
		existing.NextDueDate = item.NextDueDate
	}
	existing.IsActive = item.IsActive
	existing.AutoRegister = item.AutoRegister
	existing.EndDate = item.EndDate
	existing.UpdatedAt = time.Now().UTC()

	return s.recurringRepo.Update(ctx, id, userID, existing)
}

func (s *recurringExpenseService) DeleteRecurringExpense(ctx context.Context, id, userID string) error {
	return s.recurringRepo.Delete(ctx, id, userID)
}

// ProcessDueExpenses synchronizes and creates real expenses for all due items of the user
func (s *recurringExpenseService) ProcessDueExpenses(ctx context.Context, userID string) ([]models.Expense, error) {
	now := time.Now().UTC()
	// Consider anything due on or before today (end of today)
	endOfToday := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, time.UTC)

	dueItems, err := s.recurringRepo.FindPendingDue(ctx, userID, endOfToday)
	if err != nil {
		return nil, err
	}

	var createdExpenses []models.Expense

	for _, item := range dueItems {
		itemCopy := item
		iterations := 0
		maxIterations := 48 // Safety cap for catch-up (e.g. 2 years of quincenas)

		for !itemCopy.NextDueDate.After(endOfToday) && iterations < maxIterations {
			iterations++

			// Check if rule expired
			if itemCopy.EndDate != nil && itemCopy.NextDueDate.After(*itemCopy.EndDate) {
				itemCopy.IsActive = false
				break
			}

			// Create real Expense record
			expenseDate := itemCopy.NextDueDate
			expense := models.Expense{
				ID:            GenerateShortID("rec_"),
				UserID:        itemCopy.UserID,
				Amount:        itemCopy.Amount,
				Currency:      itemCopy.Currency,
				Description:   CleanRecurringDescription(itemCopy.Description),
				Category:      itemCopy.Category,
				PaymentMethod: itemCopy.PaymentMethod,
				Date:          expenseDate,
			}

			if err := s.expenseRepo.Create(ctx, &expense); err != nil {
				return createdExpenses, err
			}

			createdExpenses = append(createdExpenses, expense)

			execTime := time.Now().UTC()
			itemCopy.LastExecutedAt = &execTime
			itemCopy.NextDueDate = CalculateNextDueDate(itemCopy.Frequency, itemCopy.BiweeklyType, itemCopy.BillingDay, itemCopy.NextDueDate)
		}

		// Update recurring rule with new NextDueDate and LastExecutedAt
		itemCopy.UpdatedAt = time.Now().UTC()
		_, _ = s.recurringRepo.Update(ctx, itemCopy.ID, itemCopy.UserID, &itemCopy)
	}

	return createdExpenses, nil
}

// ProcessAllDueExpenses is called by background scheduler for all active users
func (s *recurringExpenseService) ProcessAllDueExpenses(ctx context.Context) (int, error) {
	now := time.Now().UTC()
	endOfToday := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, time.UTC)

	dueItems, err := s.recurringRepo.FindAllPendingDue(ctx, endOfToday)
	if err != nil {
		return 0, err
	}

	totalCreated := 0
	for _, item := range dueItems {
		itemCopy := item
		iterations := 0
		maxIterations := 48

		for !itemCopy.NextDueDate.After(endOfToday) && iterations < maxIterations {
			iterations++

			if itemCopy.EndDate != nil && itemCopy.NextDueDate.After(*itemCopy.EndDate) {
				itemCopy.IsActive = false
				break
			}

			expense := models.Expense{
				ID:            GenerateShortID("rec_"),
				UserID:        itemCopy.UserID,
				Amount:        itemCopy.Amount,
				Currency:      itemCopy.Currency,
				Description:   CleanRecurringDescription(itemCopy.Description),
				Category:      itemCopy.Category,
				PaymentMethod: itemCopy.PaymentMethod,
				Date:          itemCopy.NextDueDate,
			}

			if err := s.expenseRepo.Create(ctx, &expense); err == nil {
				totalCreated++
			}

			execTime := time.Now().UTC()
			itemCopy.LastExecutedAt = &execTime
			itemCopy.NextDueDate = CalculateNextDueDate(itemCopy.Frequency, itemCopy.BiweeklyType, itemCopy.BillingDay, itemCopy.NextDueDate)
		}

		itemCopy.UpdatedAt = time.Now().UTC()
		_, _ = s.recurringRepo.Update(ctx, itemCopy.ID, itemCopy.UserID, &itemCopy)
	}

	return totalCreated, nil
}

// ExecuteNow manually triggers execution ahead of time
func (s *recurringExpenseService) ExecuteNow(ctx context.Context, id, userID string) (*models.Expense, error) {
	item, err := s.recurringRepo.FindByIDAndUserID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	if AlreadyExecutedThisCycle(item.Frequency, item.BiweeklyType, item.LastExecutedAt, now) {
		return nil, errors.New("este cobro recurrente ya fue registrado en el ciclo actual. No se puede duplicar en el mismo período")
	}

	expense := models.Expense{
		ID:            GenerateShortID("rec_"),
		UserID:        userID,
		Amount:        item.Amount,
		Currency:      item.Currency,
		Description:   CleanRecurringDescription(item.Description),
		Category:      item.Category,
		PaymentMethod: item.PaymentMethod,
		Date:          now,
	}

	if err := s.expenseRepo.Create(ctx, &expense); err != nil {
		return nil, err
	}

	execTime := now
	item.LastExecutedAt = &execTime
	item.NextDueDate = CalculateNextDueDate(item.Frequency, item.BiweeklyType, item.BillingDay, item.NextDueDate)
	item.UpdatedAt = now

	_, _ = s.recurringRepo.Update(ctx, item.ID, item.UserID, item)
	return &expense, nil
}

// formatRecurringDescription keeps compatibility while ensuring descriptions stay clean
func formatRecurringDescription(desc string) string {
	return CleanRecurringDescription(desc)
}

// AlreadyExecutedThisCycle checks whether an execution has already occurred in the active cycle
func AlreadyExecutedThisCycle(frequency, biweeklyType string, lastExecutedAt *time.Time, now time.Time) bool {
	if lastExecutedAt == nil || lastExecutedAt.IsZero() {
		return false
	}

	last := lastExecutedAt.UTC()
	current := now.UTC()

	switch frequency {
	case models.FrequencyBiweekly:
		if biweeklyType == models.FrequencyBiweekly || biweeklyType == models.Biweekly15AndLast {
			// Check if both 'last' and 'current' fall into the same month and same quincena half
			if last.Year() == current.Year() && last.Month() == current.Month() {
				lastIsFirstHalf := last.Day() <= 15
				currentIsFirstHalf := current.Day() <= 15
				return lastIsFirstHalf == currentIsFirstHalf
			}
			return false
		}
		// every 15 days: prevent duplicate if less than 14 days have passed
		return current.Sub(last) < 14*24*time.Hour

	case models.FrequencyMonthly:
		// Check if executed in the same year and month
		return last.Year() == current.Year() && last.Month() == current.Month()

	case models.FrequencyWeekly:
		// Prevent duplicate if executed within 6 days
		return current.Sub(last) < 6*24*time.Hour

	case models.FrequencyYearly:
		// Prevent duplicate if executed within the same year
		return last.Year() == current.Year()

	default:
		return last.Year() == current.Year() && last.Month() == current.Month()
	}
}

// Helper: Last day of given month
func LastDayOfMonth(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
}

// CalculateInitialDueDate calculates the first due date from start date
func CalculateInitialDueDate(frequency, biweeklyType string, billingDay int, start time.Time) time.Time {
	y, m, d := start.Date()

	switch frequency {
	case models.FrequencyBiweekly:
		if biweeklyType == models.FrequencyBiweekly || biweeklyType == models.Biweekly15AndLast {
			lastDay := LastDayOfMonth(y, m)
			if d <= 15 {
				return time.Date(y, m, 15, 12, 0, 0, 0, time.UTC)
			}
			return time.Date(y, m, lastDay, 12, 0, 0, 0, time.UTC)
		}
		// every 15 days from start
		return time.Date(y, m, d, 12, 0, 0, 0, time.UTC)

	case models.FrequencyMonthly:
		lastDay := LastDayOfMonth(y, m)
		day := billingDay
		if day <= 0 {
			day = 15
		}
		if day > lastDay {
			day = lastDay
		}
		if d <= day {
			return time.Date(y, m, day, 12, 0, 0, 0, time.UTC)
		}
		// already passed this month, move to next month
		nextMonth := m + 1
		nextYear := y
		if nextMonth > 12 {
			nextMonth = 1
			nextYear++
		}
		nextLastDay := LastDayOfMonth(nextYear, nextMonth)
		nextDay := billingDay
		if nextDay <= 0 {
			nextDay = 15
		}
		if nextDay > nextLastDay {
			nextDay = nextLastDay
		}
		return time.Date(nextYear, nextMonth, nextDay, 12, 0, 0, 0, time.UTC)

	case models.FrequencyWeekly:
		return time.Date(y, m, d, 12, 0, 0, 0, time.UTC)

	case models.FrequencyYearly:
		return time.Date(y, m, d, 12, 0, 0, 0, time.UTC)

	default:
		return time.Date(y, m, d, 12, 0, 0, 0, time.UTC)
	}
}

// CalculateNextDueDate advances the due date to the subsequent period
func CalculateNextDueDate(frequency, biweeklyType string, billingDay int, currentDue time.Time) time.Time {
	y, m, d := currentDue.Date()

	switch frequency {
	case models.FrequencyBiweekly:
		if biweeklyType == models.FrequencyBiweekly || biweeklyType == models.Biweekly15AndLast {
			lastDay := LastDayOfMonth(y, m)
			if d < 15 {
				// Move to 15th of current month
				return time.Date(y, m, 15, 12, 0, 0, 0, time.UTC)
			}
			if d >= 15 && d < lastDay {
				// Move to last day of current month
				return time.Date(y, m, lastDay, 12, 0, 0, 0, time.UTC)
			}
			// It was the last day (or later) of the month, move to 15th of next month
			nextMonth := m + 1
			nextYear := y
			if nextMonth > 12 {
				nextMonth = 1
				nextYear++
			}
			return time.Date(nextYear, nextMonth, 15, 12, 0, 0, 0, time.UTC)
		}
		// every 15 days
		return currentDue.AddDate(0, 0, 15)

	case models.FrequencyMonthly:
		nextMonth := m + 1
		nextYear := y
		if nextMonth > 12 {
			nextMonth = 1
			nextYear++
		}
		lastDay := LastDayOfMonth(nextYear, nextMonth)
		day := billingDay
		if day <= 0 {
			day = 15
		}
		if day > lastDay {
			day = lastDay
		}
		return time.Date(nextYear, nextMonth, day, 12, 0, 0, 0, time.UTC)

	case models.FrequencyWeekly:
		return currentDue.AddDate(0, 0, 7)

	case models.FrequencyYearly:
		return currentDue.AddDate(1, 0, 0)

	default:
		return currentDue.AddDate(0, 0, 15)
	}
}
