package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type RecurringIncomeService interface {
	GetRecurringIncomes(ctx context.Context, userID string) ([]models.RecurringIncome, error)
	GetRecurringIncomeByID(ctx context.Context, id, userID string) (*models.RecurringIncome, error)
	CreateRecurringIncome(ctx context.Context, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error)
	UpdateRecurringIncome(ctx context.Context, id, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error)
	DeleteRecurringIncome(ctx context.Context, id, userID string) error
	ProcessDueIncomes(ctx context.Context, userID string) ([]models.Income, error)
	ProcessAllDueIncomes(ctx context.Context) (int, error)
	ExecuteNow(ctx context.Context, id, userID string) (*models.Income, error)
}

type recurringIncomeService struct {
	recurringRepo repository.RecurringIncomeRepository
	incomeRepo    repository.IncomeRepository
}

func NewRecurringIncomeService(
	recurringRepo repository.RecurringIncomeRepository,
	incomeRepo repository.IncomeRepository,
) RecurringIncomeService {
	return &recurringIncomeService{
		recurringRepo: recurringRepo,
		incomeRepo:    incomeRepo,
	}
}

func (s *recurringIncomeService) GetRecurringIncomes(ctx context.Context, userID string) ([]models.RecurringIncome, error) {
	return s.recurringRepo.FindByUserID(ctx, userID)
}

func (s *recurringIncomeService) GetRecurringIncomeByID(ctx context.Context, id, userID string) (*models.RecurringIncome, error) {
	return s.recurringRepo.FindByIDAndUserID(ctx, id, userID)
}

func (s *recurringIncomeService) CreateRecurringIncome(ctx context.Context, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error) {
	if item.Amount <= 0 {
		return nil, errors.New("el monto debe ser mayor a 0")
	}
	if item.Description == "" {
		return nil, errors.New("la descripción es obligatoria")
	}
	if item.Source == "" {
		item.Source = "Salario"
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

	item.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	item.UserID = userID
	item.IsActive = true
	item.AutoRegister = true

	now := time.Now().UTC()
	if item.StartDate.IsZero() {
		item.StartDate = now
	}

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

func (s *recurringIncomeService) UpdateRecurringIncome(ctx context.Context, id, userID string, item *models.RecurringIncome) (*models.RecurringIncome, error) {
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
	if item.Source != "" {
		existing.Source = item.Source
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

func (s *recurringIncomeService) DeleteRecurringIncome(ctx context.Context, id, userID string) error {
	return s.recurringRepo.Delete(ctx, id, userID)
}

// ProcessDueIncomes synchronizes and registers real incomes for all due items of the user
func (s *recurringIncomeService) ProcessDueIncomes(ctx context.Context, userID string) ([]models.Income, error) {
	now := time.Now().UTC()
	endOfToday := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, time.UTC)

	dueItems, err := s.recurringRepo.FindPendingDue(ctx, userID, endOfToday)
	if err != nil {
		return nil, err
	}

	var createdIncomes []models.Income

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

			incomeDate := itemCopy.NextDueDate
			income := models.Income{
				ID:            fmt.Sprintf("%d", time.Now().UnixNano()),
				UserID:        itemCopy.UserID,
				Amount:        itemCopy.Amount,
				Currency:      itemCopy.Currency,
				Description:   formatRecurringDescription(itemCopy.Description),
				Source:        itemCopy.Source,
				PaymentMethod: itemCopy.PaymentMethod,
				Date:          incomeDate,
			}

			if err := s.incomeRepo.Create(ctx, &income); err != nil {
				return createdIncomes, err
			}

			createdIncomes = append(createdIncomes, income)

			execTime := time.Now().UTC()
			itemCopy.LastExecutedAt = &execTime
			itemCopy.NextDueDate = CalculateNextDueDate(itemCopy.Frequency, itemCopy.BiweeklyType, itemCopy.BillingDay, itemCopy.NextDueDate)
		}

		itemCopy.UpdatedAt = time.Now().UTC()
		_, _ = s.recurringRepo.Update(ctx, itemCopy.ID, itemCopy.UserID, &itemCopy)
	}

	return createdIncomes, nil
}

// ProcessAllDueIncomes is called by background scheduler for all active users
func (s *recurringIncomeService) ProcessAllDueIncomes(ctx context.Context) (int, error) {
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

			income := models.Income{
				ID:            fmt.Sprintf("%d", time.Now().UnixNano()),
				UserID:        itemCopy.UserID,
				Amount:        itemCopy.Amount,
				Currency:      itemCopy.Currency,
				Description:   formatRecurringDescription(itemCopy.Description),
				Source:        itemCopy.Source,
				PaymentMethod: itemCopy.PaymentMethod,
				Date:          itemCopy.NextDueDate,
			}

			if err := s.incomeRepo.Create(ctx, &income); err == nil {
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

// ExecuteNow manually triggers collection/registration ahead of time
func (s *recurringIncomeService) ExecuteNow(ctx context.Context, id, userID string) (*models.Income, error) {
	item, err := s.recurringRepo.FindByIDAndUserID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	if AlreadyExecutedThisCycle(item.Frequency, item.BiweeklyType, item.LastExecutedAt, now) {
		return nil, errors.New("este cobro recurrente ya fue registrado en el ciclo actual. No se puede duplicar en el mismo período")
	}

	income := models.Income{
		ID:            fmt.Sprintf("%d", now.UnixNano()),
		UserID:        userID,
		Amount:        item.Amount,
		Currency:      item.Currency,
		Description:   formatRecurringDescription(item.Description),
		Source:        item.Source,
		PaymentMethod: item.PaymentMethod,
		Date:          now,
	}

	if err := s.incomeRepo.Create(ctx, &income); err != nil {
		return nil, err
	}

	execTime := now
	item.LastExecutedAt = &execTime
	item.NextDueDate = CalculateNextDueDate(item.Frequency, item.BiweeklyType, item.BillingDay, item.NextDueDate)
	item.UpdatedAt = now

	_, _ = s.recurringRepo.Update(ctx, item.ID, item.UserID, item)
	return &income, nil
}
