package memory_repo

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type MemoryCategoryRepository struct {
	mu          sync.RWMutex
	categories  []models.Category
	storageFile string
}

func NewMemoryCategoryRepository(storageFile string) repository.CategoryRepository {
	repo := &MemoryCategoryRepository{
		categories:  []models.Category{},
		storageFile: storageFile,
	}
	repo.loadFromFile()
	return repo
}

func (r *MemoryCategoryRepository) loadFromFile() {
	if _, err := os.Stat(r.storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(r.storageFile)
	if err != nil {
		log.Printf("Error reading categories file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &r.categories)
}

func (r *MemoryCategoryRepository) saveToFile() {
	data, err := json.MarshalIndent(r.categories, "", "  ")
	if err != nil {
		log.Printf("Error marshaling categories data: %v", err)
		return
	}
	_ = os.WriteFile(r.storageFile, data, 0644)
}

func (r *MemoryCategoryRepository) FindByUserID(ctx context.Context, userID, catType string) ([]models.Category, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.Category
	for _, c := range r.categories {
		if (c.UserID == userID || c.UserID == "") && (catType == "" || c.Type == catType) {
			result = append(result, c)
		}
	}
	return result, nil
}

func (r *MemoryCategoryRepository) FindByNameAndType(ctx context.Context, userID, name, catType string) (*models.Category, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.categories {
		if c.UserID == userID && strings.EqualFold(c.Name, name) && c.Type == catType {
			cat := c
			return &cat, nil
		}
	}
	return nil, errors.New("category not found")
}

func (r *MemoryCategoryRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.Category, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.categories {
		if c.ID == id && (c.UserID == userID || c.UserID == "") {
			cat := c
			return &cat, nil
		}
	}
	return nil, errors.New("category not found")
}

func (r *MemoryCategoryRepository) Create(ctx context.Context, category *models.Category) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.categories = append(r.categories, *category)
	r.saveToFile()
	return nil
}

func (r *MemoryCategoryRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, c := range r.categories {
		if c.ID == id && (c.UserID == userID || c.UserID == "") {
			r.categories = append(r.categories[:i], r.categories[i+1:]...)
			r.saveToFile()
			return nil
		}
	}
	return errors.New("category not found")
}
