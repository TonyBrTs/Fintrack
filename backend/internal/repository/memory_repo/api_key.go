package memory_repo

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"sync"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type MemoryAPIKeyRepository struct {
	mu          sync.RWMutex
	keys        []models.APIKey
	storageFile string
}

func NewMemoryAPIKeyRepository(storageFile string) repository.APIKeyRepository {
	repo := &MemoryAPIKeyRepository{
		keys:        []models.APIKey{},
		storageFile: storageFile,
	}
	repo.loadFromFile()
	return repo
}

func (r *MemoryAPIKeyRepository) loadFromFile() {
	if _, err := os.Stat(r.storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(r.storageFile)
	if err != nil {
		log.Printf("Error reading api keys file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &r.keys)
}

func (r *MemoryAPIKeyRepository) saveToFile() {
	data, err := json.MarshalIndent(r.keys, "", "  ")
	if err != nil {
		log.Printf("Error marshaling api keys data: %v", err)
		return
	}
	_ = os.WriteFile(r.storageFile, data, 0644)
}

func (r *MemoryAPIKeyRepository) FindByUserID(ctx context.Context, userID string) ([]models.APIKey, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.APIKey
	for _, k := range r.keys {
		if k.UserID == userID || k.UserID == "" {
			result = append(result, k)
		}
	}
	return result, nil
}

func (r *MemoryAPIKeyRepository) FindByHash(ctx context.Context, keyHash string) (*models.APIKey, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, k := range r.keys {
		if k.KeyHash == keyHash && k.IsActive {
			cp := k
			return &cp, nil
		}
	}
	return nil, errors.New("api key not found")
}

func (r *MemoryAPIKeyRepository) Create(ctx context.Context, key *models.APIKey) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.keys = append([]models.APIKey{*key}, r.keys...)
	r.saveToFile()
	return nil
}

func (r *MemoryAPIKeyRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, k := range r.keys {
		if k.ID == id && (k.UserID == userID || k.UserID == "") {
			r.keys = append(r.keys[:i], r.keys[i+1:]...)
			r.saveToFile()
			return nil
		}
	}
	return errors.New("api key not found")
}

func (r *MemoryAPIKeyRepository) UpdateLastUsed(ctx context.Context, id string, lastUsed time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, k := range r.keys {
		if k.ID == id {
			r.keys[i].LastUsedAt = &lastUsed
			r.saveToFile()
			return nil
		}
	}
	return nil
}
