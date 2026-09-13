package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type categoryService struct {
	categoryRepo repository.CategoryRepository
	expenseRepo  repository.ExpenseRepository
	incomeRepo   repository.IncomeRepository
}

func NewCategoryService(
	catRepo repository.CategoryRepository,
	expRepo repository.ExpenseRepository,
	incRepo repository.IncomeRepository,
) CategoryService {
	return &categoryService{
		categoryRepo: catRepo,
		expenseRepo:  expRepo,
		incomeRepo:   incRepo,
	}
}

func (s *categoryService) GetCategories(ctx context.Context, userID, catType string) ([]models.CategoryResponse, error) {
	catType = strings.ToLower(strings.TrimSpace(catType))
	var resultList []models.CategoryResponse

	// Add default system categories matching filter
	if catType == "" || catType == "expense" {
		resultList = append(resultList, models.DefaultExpenseCategories...)
	}
	if catType == "" || catType == "income" {
		resultList = append(resultList, models.DefaultIncomeSources...)
	}

	userCategories, err := s.categoryRepo.FindByUserID(ctx, userID, catType)
	if err != nil {
		return nil, err
	}

	for _, c := range userCategories {
		resultList = append(resultList, models.CategoryResponse{
			ID:        c.ID,
			UserID:    c.UserID,
			Name:      c.Name,
			Type:      c.Type,
			Color:     c.Color,
			Icon:      c.Icon,
			IsDefault: false,
			CreatedAt: c.CreatedAt,
		})
	}

	return resultList, nil
}

func (s *categoryService) CreateCategory(ctx context.Context, userID, name, catType, color, icon string) (*models.CategoryResponse, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("el nombre de la categoría es requerido")
	}
	if len(name) > 50 {
		return nil, errors.New("el nombre de la categoría no debe exceder 50 caracteres")
	}

	catType = strings.ToLower(strings.TrimSpace(catType))
	if catType != "expense" && catType != "income" {
		return nil, errors.New("el tipo de categoría debe ser 'expense' o 'income'")
	}

	color = strings.TrimSpace(color)
	if color == "" {
		color = "blue"
	}

	icon = strings.TrimSpace(icon)
	if icon == "" {
		icon = "tag"
	}

	// Check collision with default system categories
	if catType == "expense" {
		for _, def := range models.DefaultExpenseCategories {
			if strings.EqualFold(def.Name, name) {
				return nil, errors.New("ya existe una categoría del sistema con ese nombre")
			}
		}
	} else {
		for _, def := range models.DefaultIncomeSources {
			if strings.EqualFold(def.Name, name) {
				return nil, errors.New("ya existe una categoría del sistema con ese nombre")
			}
		}
	}

	// Check if already created by user
	existing, err := s.categoryRepo.FindByNameAndType(ctx, userID, name, catType)
	if err == nil && existing != nil {
		return nil, errors.New("ya tienes una categoría creada con este nombre")
	}

	newCat := models.Category{
		ID:        fmt.Sprintf("cat-%d", time.Now().UnixNano()),
		UserID:    userID,
		Name:      name,
		Type:      catType,
		Color:     color,
		Icon:      icon,
		CreatedAt: time.Now(),
	}

	if err := s.categoryRepo.Create(ctx, &newCat); err != nil {
		return nil, err
	}

	return &models.CategoryResponse{
		ID:        newCat.ID,
		UserID:    newCat.UserID,
		Name:      newCat.Name,
		Type:      newCat.Type,
		Color:     newCat.Color,
		Icon:      newCat.Icon,
		IsDefault: false,
		CreatedAt: newCat.CreatedAt,
	}, nil
}

func (s *categoryService) DeleteCategory(ctx context.Context, id, userID, reassignTo string) (*DeleteCategoryResult, error) {
	if strings.HasPrefix(id, "default-") {
		return nil, errors.New("las categorías del sistema no se pueden eliminar")
	}

	cat, err := s.categoryRepo.FindByIDAndUserID(ctx, id, userID)
	if err != nil || cat == nil {
		return nil, errors.New("categoría no encontrada o no autorizada")
	}

	var count int64
	if cat.Type == "expense" {
		count, _ = s.expenseRepo.CountByCategory(ctx, userID, cat.Name)
	} else {
		count, _ = s.incomeRepo.CountBySource(ctx, userID, cat.Name)
	}

	if count > 0 {
		if reassignTo == "" {
			return nil, &CategoryInUseError{
				Count:        count,
				CategoryName: cat.Name,
				CategoryType: cat.Type,
			}
		}

		// Reassign matching transactions
		if cat.Type == "expense" {
			if err := s.expenseRepo.ReassignCategory(ctx, userID, cat.Name, reassignTo); err != nil {
				return nil, fmt.Errorf("no fue posible reasignar los gastos: %w", err)
			}
		} else {
			if err := s.incomeRepo.ReassignSource(ctx, userID, cat.Name, reassignTo); err != nil {
				return nil, fmt.Errorf("no fue posible reasignar los ingresos: %w", err)
			}
		}
	}

	if err := s.categoryRepo.Delete(ctx, id, userID); err != nil {
		return nil, fmt.Errorf("no fue posible eliminar la categoría: %w", err)
	}

	return &DeleteCategoryResult{
		Message:         "Categoría eliminada exitosamente",
		Reassigned:      count > 0,
		ReassignedTo:    reassignTo,
		ReassignedCount: count,
	}, nil
}
