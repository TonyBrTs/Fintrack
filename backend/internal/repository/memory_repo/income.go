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

type MemoryIncomeRepository struct {
	mu          sync.RWMutex
	incomes     []models.Income
	storageFile string
}

func NewMemoryIncomeRepository(storageFile string) repository.IncomeRepository {
	repo := &MemoryIncomeRepository{
		incomes:     []models.Income{},
		storageFile: storageFile,
	}
	repo.loadFromFile()
	return repo
}

func (r *MemoryIncomeRepository) loadFromFile() {
	if _, err := os.Stat(r.storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(r.storageFile)
	if err != nil {
		log.Printf("Error reading incomes file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &r.incomes)
}

func (r *MemoryIncomeRepository) saveToFile() {
	data, err := json.MarshalIndent(r.incomes, "", "  ")
	if err != nil {
		log.Printf("Error marshaling incomes data: %v", err)
		return
	}
	_ = os.WriteFile(r.storageFile, data, 0644)
}

func (r *MemoryIncomeRepository) FindByUserID(ctx context.Context, userID string) ([]models.Income, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.Income
	for _, inc := range r.incomes {
		if inc.UserID == userID || inc.UserID == "" {
			result = append(result, inc)
		}
	}
	return result, nil
}

func (r *MemoryIncomeRepository) Create(ctx context.Context, income *models.Income) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.incomes = append([]models.Income{*income}, r.incomes...)
	r.saveToFile()
	return nil
}

func (r *MemoryIncomeRepository) Update(ctx context.Context, id, userID string, income *models.Income) (*models.Income, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, inc := range r.incomes {
		if inc.ID == id && (inc.UserID == userID || inc.UserID == "") {
			income.ID = id
			income.UserID = userID
			if income.Date.IsZero() {
				income.Date = inc.Date
			}
			r.incomes[i] = *income
			r.saveToFile()
			return income, nil
		}
	}
	return nil, errors.New("income not found")
}

func (r *MemoryIncomeRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, inc := range r.incomes {
		if inc.ID == id && (inc.UserID == userID || inc.UserID == "") {
			r.incomes = append(r.incomes[:i], r.incomes[i+1:]...)
			r.saveToFile()
			return nil
		}
	}
	return errors.New("income not found")
}

func (r *MemoryIncomeRepository) CountBySource(ctx context.Context, userID, source string) (int64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var count int64
	for _, inc := range r.incomes {
		if inc.UserID == userID && inc.Source == source {
			count++
		}
	}
	return count, nil
}

func (r *MemoryIncomeRepository) ReassignSource(ctx context.Context, userID, oldSource, newSource string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i := range r.incomes {
		if r.incomes[i].UserID == userID && r.incomes[i].Source == oldSource {
			r.incomes[i].Source = newSource
		}
	}
	r.saveToFile()
	return nil
}
