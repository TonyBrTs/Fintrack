package services

import (
	"context"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type incomeService struct {
	repo repository.IncomeRepository
}

func NewIncomeService(repo repository.IncomeRepository) IncomeService {
	return &incomeService{repo: repo}
}

func (s *incomeService) GetIncomes(ctx context.Context, userID string) ([]models.Income, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *incomeService) CreateIncome(ctx context.Context, userID string, income *models.Income) (*models.Income, error) {
	if income.ID == "" {
		income.ID = GenerateShortID("inc_")
	}
	income.UserID = userID
	if income.Date.IsZero() {
		income.Date = time.Now()
	}
	if err := s.repo.Create(ctx, income); err != nil {
		return nil, err
	}
	return income, nil
}

func (s *incomeService) UpdateIncome(ctx context.Context, id, userID string, income *models.Income) (*models.Income, error) {
	return s.repo.Update(ctx, id, userID, income)
}

func (s *incomeService) DeleteIncome(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}
