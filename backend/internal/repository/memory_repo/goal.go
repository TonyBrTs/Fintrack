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

type MemoryGoalRepository struct {
	mu          sync.RWMutex
	goals       []models.Goal
	storageFile string
}

func NewMemoryGoalRepository(storageFile string) repository.GoalRepository {
	repo := &MemoryGoalRepository{
		goals:       []models.Goal{},
		storageFile: storageFile,
	}
	repo.loadFromFile()
	return repo
}

func (r *MemoryGoalRepository) loadFromFile() {
	if _, err := os.Stat(r.storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(r.storageFile)
	if err != nil {
		log.Printf("Error reading goals file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &r.goals)
}

func (r *MemoryGoalRepository) saveToFile() {
	data, err := json.MarshalIndent(r.goals, "", "  ")
	if err != nil {
		log.Printf("Error marshaling goals data: %v", err)
		return
	}
	_ = os.WriteFile(r.storageFile, data, 0644)
}

func (r *MemoryGoalRepository) FindByUserID(ctx context.Context, userID string) ([]models.Goal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.Goal
	for _, g := range r.goals {
		if g.UserID == userID || g.UserID == "" {
			result = append(result, g)
		}
	}
	return result, nil
}

func (r *MemoryGoalRepository) Create(ctx context.Context, goal *models.Goal) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.goals = append([]models.Goal{*goal}, r.goals...)
	r.saveToFile()
	return nil
}

func (r *MemoryGoalRepository) Update(ctx context.Context, id, userID string, goal *models.Goal) (*models.Goal, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, g := range r.goals {
		if g.ID == id && (g.UserID == userID || g.UserID == "") {
			goal.ID = id
			goal.UserID = userID
			if goal.Deadline.IsZero() {
				goal.Deadline = g.Deadline
			}
			r.goals[i] = *goal
			r.saveToFile()
			return goal, nil
		}
	}
	return nil, errors.New("goal not found")
}

func (r *MemoryGoalRepository) Delete(ctx context.Context, id, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, g := range r.goals {
		if g.ID == id && (g.UserID == userID || g.UserID == "") {
			r.goals = append(r.goals[:i], r.goals[i+1:]...)
			r.saveToFile()
			return nil
		}
	}
	return errors.New("goal not found")
}
