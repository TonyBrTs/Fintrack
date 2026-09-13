package memory_repo

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"sync"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type MemoryExpenseRepository struct {
	mu          sync.RWMutex
	expenses    []models.Expense
	storageFile string
}

func NewMemoryExpenseRepository(storageFile string) repository.ExpenseRepository {
	repo := &MemoryExpenseRepository{
		expenses:    []models.Expense{},
		storageFile: storageFile,
	}
	repo.loadFromFile()
	return repo
}

func (r *MemoryExpenseRepository) loadFromFile() {
	if _, err := os.Stat(r.storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(r.storageFile)
	if err != nil {
		log.Printf("Error reading expenses file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &r.expenses)
}

func (r *MemoryExpenseRepository) saveToFile() {
	data, err := json.MarshalIndent(r.expenses, "", "  ")
	if err != nil {
		log.Printf("Error marshaling expenses data: %v", err)
		return
	}
	_ = os.WriteFile(r.storageFile, data, 0644)
}

func (r *MemoryExpenseRepository) FindByUserID(ctx context.Context, userID string) ([]models.Expense, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.Expense
	for _, exp := range r.expenses {
		if exp.UserID == userID || exp.UserID == "" {
			result = append(result, exp)
		}
	}
	return result, nil
}

func (r *MemoryExpenseRepository) Create(ctx context.Context, expense *models.Expense) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.expenses = append([]models.Expense{*expense}, r.expenses...)
	r.saveToFile()
	return nil
}

func (r *MemoryExpenseRepository) Update(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, exp := range r.expenses {
		if exp.ID == id && (exp.UserID == userID || exp.UserID == "") {
			expense.ID = id
			expense.UserID = userID
			if expense.Date.IsZero() {
				expense.Date = exp.Date
			}
			r.expenses[i] = *expense
			r.saveToFile()
			return expense, nil
		}
	}
	return nil, errors.New("expense not found")
}

func (r *MemoryExpenseRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, exp := range r.expenses {
		if exp.ID == id && (exp.UserID == userID || exp.UserID == "") {
			r.expenses = append(r.expenses[:i], r.expenses[i+1:]...)
			r.saveToFile()
			return nil
		}
	}
	return errors.New("expense not found")
}

func (r *MemoryExpenseRepository) CountByCategory(ctx context.Context, userID, category string) (int64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var count int64
	for _, exp := range r.expenses {
		if exp.UserID == userID && exp.Category == category {
			count++
		}
	}
	return count, nil
}

func (r *MemoryExpenseRepository) ReassignCategory(ctx context.Context, userID, oldCategory, newCategory string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i := range r.expenses {
		if r.expenses[i].UserID == userID && r.expenses[i].Category == oldCategory {
			r.expenses[i].Category = newCategory
		}
	}
	r.saveToFile()
	return nil
}
