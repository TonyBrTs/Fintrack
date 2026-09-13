package gorm_repo

import (
	"context"
	"errors"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"gorm.io/gorm"
)

type GormGoalRepository struct {
	db *gorm.DB
}

func NewGormGoalRepository(db *gorm.DB) repository.GoalRepository {
	return &GormGoalRepository{db: db}
}

func (r *GormGoalRepository) FindByUserID(ctx context.Context, userID string) ([]models.Goal, error) {
	var goals []models.Goal
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("deadline asc").
		Find(&goals).Error
	return goals, err
}

func (r *GormGoalRepository) Create(ctx context.Context, goal *models.Goal) error {
	return r.db.WithContext(ctx).Create(goal).Error
}

func (r *GormGoalRepository) Update(ctx context.Context, id, userID string, goal *models.Goal) (*models.Goal, error) {
	result := r.db.WithContext(ctx).Model(&models.Goal{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"name":           goal.Name,
			"target_amount":  goal.TargetAmount,
			"current_amount": goal.CurrentAmount,
			"deadline":       goal.Deadline,
			"category":       goal.Category,
		})

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("goal not found or unauthorized")
	}

	goal.ID = id
	goal.UserID = userID
	return goal, nil
}

func (r *GormGoalRepository) Delete(ctx context.Context, id, userID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.Goal{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("goal not found or unauthorized")
	}
	return nil
}
