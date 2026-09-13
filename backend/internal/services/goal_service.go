package services

import (
	"context"
	"fmt"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type goalService struct {
	repo repository.GoalRepository
}

func NewGoalService(repo repository.GoalRepository) GoalService {
	return &goalService{repo: repo}
}

func (s *goalService) GetGoals(ctx context.Context, userID string) ([]models.Goal, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *goalService) CreateGoal(ctx context.Context, userID string, goal *models.Goal) (*models.Goal, error) {
	goal.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	goal.UserID = userID
	if goal.Deadline.IsZero() {
		goal.Deadline = time.Now().AddDate(0, 6, 0)
	}
	if err := s.repo.Create(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (s *goalService) UpdateGoal(ctx context.Context, id, userID string, goal *models.Goal) (*models.Goal, error) {
	return s.repo.Update(ctx, id, userID, goal)
}

func (s *goalService) DeleteGoal(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}
