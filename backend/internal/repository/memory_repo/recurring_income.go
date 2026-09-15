package memory_repo

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"sort"
	"sync"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type MemoryRecurringIncomeRepository struct {
	mu          sync.RWMutex
	items       []models.RecurringIncome
	storageFile string
}

func NewMemoryRecurringIncomeRepository(storageFile string) repository.RecurringIncomeRepository {
	repo := &MemoryRecurringIncomeRepository{
		items:       []models.RecurringIncome{},
		storageFile: storageFile,
	}
	repo.loadFromFile()
	return repo
}

func (r *MemoryRecurringIncomeRepository) loadFromFile() {
	if _, err := os.Stat(r.storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(r.storageFile)
	if err != nil {
		log.Printf("Error reading recurring incomes file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &r.items)
}

func (r *MemoryRecurringIncomeRepository) saveToFile() {
	data, err := json.MarshalIndent(r.items, "", "  ")
	if err != nil {
		log.Printf("Error marshaling recurring incomes data: %v", err)
		return
	}
	_ = os.WriteFile(r.storageFile, data, 0644)
}

func (r *MemoryRecurringIncomeRepository) FindByUserID(ctx context.Context, userID string) ([]models.RecurringIncome, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.RecurringIncome
	for _, item := range r.items {
		if item.UserID == userID || item.UserID == "" {
			result = append(result, item)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].IsActive != result[j].IsActive {
			return result[i].IsActive // active first
		}
		return result[i].NextDueDate.Before(result[j].NextDueDate)
	})

	return result, nil
}

func (r *MemoryRecurringIncomeRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringIncome, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, item := range r.items {
		if item.ID == id && (item.UserID == userID || item.UserID == "") {
			cp := item
			return &cp, nil
		}
	}
	return nil, errors.New("recurring income not found")
}

func (r *MemoryRecurringIncomeRepository) FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringIncome, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.RecurringIncome
	for _, item := range r.items {
		if (item.UserID == userID || item.UserID == "") && item.IsActive && item.AutoRegister && !item.NextDueDate.After(until) {
			result = append(result, item)
		}
	}
	return result, nil
}

func (r *MemoryRecurringIncomeRepository) FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringIncome, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.RecurringIncome
	for _, item := range r.items {
		if item.IsActive && item.AutoRegister && !item.NextDueDate.After(until) {
			result = append(result, item)
		}
	}
	return result, nil
}

func (r *MemoryRecurringIncomeRepository) Create(ctx context.Context, recurring *models.RecurringIncome) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.items = append([]models.RecurringIncome{*recurring}, r.items...)
	r.saveToFile()
	return nil
}

func (r *MemoryRecurringIncomeRepository) Update(ctx context.Context, id, userID string, recurring *models.RecurringIncome) (*models.RecurringIncome, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, item := range r.items {
		if item.ID == id && (item.UserID == userID || item.UserID == "") {
			recurring.ID = id
			recurring.UserID = item.UserID
			recurring.CreatedAt = item.CreatedAt
			recurring.UpdatedAt = time.Now()
			r.items[i] = *recurring
			r.saveToFile()
			return recurring, nil
		}
	}
	return nil, errors.New("recurring income not found or unauthorized")
}

func (r *MemoryRecurringIncomeRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, item := range r.items {
		if item.ID == id && (item.UserID == userID || item.UserID == "") {
			r.items = append(r.items[:i], r.items[i+1:]...)
			r.saveToFile()
			return nil
		}
	}
	return errors.New("recurring income not found or unauthorized")
}
