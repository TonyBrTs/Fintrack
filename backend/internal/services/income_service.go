package services

import (
	"context"
	"strings"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type incomeService struct {
	repo    repository.IncomeRepository
	catRepo repository.CategoryRepository
}

func NewIncomeService(repo repository.IncomeRepository, catRepos ...repository.CategoryRepository) IncomeService {
	var catRepo repository.CategoryRepository
	if len(catRepos) > 0 {
		catRepo = catRepos[0]
	}
	return &incomeService{repo: repo, catRepo: catRepo}
}

func (s *incomeService) GetIncomes(ctx context.Context, userID string) ([]models.Income, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *incomeService) CreateIncome(ctx context.Context, userID string, income *models.Income) (*models.Income, error) {
	if income.ID == "" {
		income.ID = GenerateShortID("inc_")
	}
	income.UserID = userID
	if income.Currency == "" {
		income.Currency = "USD"
	}
	if income.Description == "" {
		income.Description = "Ingreso automatizado"
	}

	// 1. Resolve Source ID or Name
	sourceInput := strings.TrimSpace(income.SourceID)
	if sourceInput == "" {
		sourceInput = strings.TrimSpace(income.Source)
	}
	if sourceInput != "" {
		resolvedDefault := models.ResolveDefaultCategoryName(sourceInput, "income")
		if resolvedDefault != "" {
			income.Source = resolvedDefault
		} else if s.catRepo != nil {
			// Look up custom income source category by ID
			customCat, err := s.catRepo.FindByIDAndUserID(ctx, sourceInput, userID)
			if err == nil && customCat != nil {
				income.Source = customCat.Name
			} else {
				customByName, err := s.catRepo.FindByNameAndType(ctx, userID, sourceInput, "income")
				if err == nil && customByName != nil {
					income.Source = customByName.Name
				} else {
					income.Source = sourceInput
				}
			}
		} else {
			income.Source = sourceInput
		}
	} else {
		income.Source = models.SourceOtros
	}

	// 2. Resolve Payment Method ID or Name
	pmInput := strings.TrimSpace(income.PaymentMethodID)
	if pmInput == "" {
		pmInput = strings.TrimSpace(income.PaymentMethod)
	}
	if pmInput != "" {
		income.PaymentMethod = models.ResolvePaymentMethodName(pmInput)
	} else {
		income.PaymentMethod = "Automático (API)"
	}

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
