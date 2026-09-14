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

type MemoryRecurringExpenseRepository struct {
	mu          sync.RWMutex
	items       []models.RecurringExpense
	storageFile string
}

func NewMemoryRecurringExpenseRepository(storageFile string) repository.RecurringExpenseRepository {
	repo := &MemoryRecurringExpenseRepository{
		items:       []models.RecurringExpense{},
		storageFile: storageFile,
	}
	repo.loadFromFile()
	return repo
}

func (r *MemoryRecurringExpenseRepository) loadFromFile() {
	if _, err := os.Stat(r.storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(r.storageFile)
	if err != nil {
		log.Printf("Error reading recurring expenses file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &r.items)
}

func (r *MemoryRecurringExpenseRepository) saveToFile() {
	data, err := json.MarshalIndent(r.items, "", "  ")
	if err != nil {
		log.Printf("Error marshaling recurring expenses data: %v", err)
		return
	}
	_ = os.WriteFile(r.storageFile, data, 0644)
}

func (r *MemoryRecurringExpenseRepository) FindByUserID(ctx context.Context, userID string) ([]models.RecurringExpense, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.RecurringExpense
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

func (r *MemoryRecurringExpenseRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.RecurringExpense, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, item := range r.items {
		if item.ID == id && (item.UserID == userID || item.UserID == "") {
			cp := item
			return &cp, nil
		}
	}
	return nil, errors.New("recurring expense not found")
}

func (r *MemoryRecurringExpenseRepository) FindPendingDue(ctx context.Context, userID string, until time.Time) ([]models.RecurringExpense, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.RecurringExpense
	for _, item := range r.items {
		if (item.UserID == userID || item.UserID == "") && item.IsActive && !item.NextDueDate.After(until) {
			result = append(result, item)
		}
	}
	return result, nil
}

func (r *MemoryRecurringExpenseRepository) FindAllPendingDue(ctx context.Context, until time.Time) ([]models.RecurringExpense, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.RecurringExpense
	for _, item := range r.items {
		if item.IsActive && !item.NextDueDate.After(until) {
			result = append(result, item)
		}
	}
	return result, nil
}

func (r *MemoryRecurringExpenseRepository) Create(ctx context.Context, recurring *models.RecurringExpense) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.items = append([]models.RecurringExpense{*recurring}, r.items...)
	r.saveToFile()
	return nil
}

func (r *MemoryRecurringExpenseRepository) Update(ctx context.Context, id, userID string, recurring *models.RecurringExpense) (*models.RecurringExpense, error) {
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
	return nil, errors.New("recurring expense not found or unauthorized")
}

func (r *MemoryRecurringExpenseRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, item := range r.items {
		if item.ID == id && (item.UserID == userID || item.UserID == "") {
			r.items = append(r.items[:i], r.items[i+1:]...)
			r.saveToFile()
			return nil
		}
	}
	return errors.New("recurring expense not found or unauthorized")
}
