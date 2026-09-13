package services_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

// MockCategoryRepository implements repository.CategoryRepository for unit testing.
type MockCategoryRepository struct {
	categories []models.Category
	errToRet   error
}

func (m *MockCategoryRepository) FindByUserID(ctx context.Context, userID, catType string) ([]models.Category, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.Category
	for _, c := range m.categories {
		if c.UserID == userID && (catType == "" || c.Type == catType) {
			res = append(res, c)
		}
	}
	return res, nil
}

func (m *MockCategoryRepository) FindByNameAndType(ctx context.Context, userID, name, catType string) (*models.Category, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	for _, c := range m.categories {
		if c.UserID == userID && c.Name == name && c.Type == catType {
			return &c, nil
		}
	}
	return nil, nil
}

func (m *MockCategoryRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.Category, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	for _, c := range m.categories {
		if c.ID == id && c.UserID == userID {
			return &c, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *MockCategoryRepository) Create(ctx context.Context, category *models.Category) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	m.categories = append(m.categories, *category)
	return nil
}

func (m *MockCategoryRepository) Delete(ctx context.Context, id, userID string) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	for i, c := range m.categories {
		if c.ID == id && c.UserID == userID {
			m.categories = append(m.categories[:i], m.categories[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func TestCategoryService_GetCategories_MergeDefaults(t *testing.T) {
	catRepo := &MockCategoryRepository{
		categories: []models.Category{
			{
				ID:        "custom-cat-1",
				UserID:    "user-cat-1",
				Name:      "Criptomonedas",
				Type:      "expense",
				CreatedAt: time.Now(),
			},
		},
	}
	expRepo := &MockExpenseRepository{}
	incRepo := &MockIncomeRepository{}
	svc := services.NewCategoryService(catRepo, expRepo, incRepo)

	ctx := context.Background()
	allCategories, err := svc.GetCategories(ctx, "user-cat-1", "expense")
	if err != nil {
		t.Fatalf("failed to get categories: %v", err)
	}

	// Should contain models.DefaultExpenseCategories + custom category
	if len(allCategories) <= len(models.DefaultExpenseCategories) {
		t.Errorf("expected merged categories to be greater than defaults")
	}

	foundCustom := false
	for _, c := range allCategories {
		if c.Name == "Criptomonedas" {
			foundCustom = true
			if c.IsDefault {
				t.Errorf("expected custom category to have IsDefault=false")
			}
		}
	}
	if !foundCustom {
		t.Errorf("custom category not found in merged list")
	}
}

func TestCategoryService_CreateCategory_Validation(t *testing.T) {
	catRepo := &MockCategoryRepository{}
	expRepo := &MockExpenseRepository{}
	incRepo := &MockIncomeRepository{}
	svc := services.NewCategoryService(catRepo, expRepo, incRepo)

	ctx := context.Background()
	userID := "user-cat-2"

	// 1. Empty name should fail
	_, err := svc.CreateCategory(ctx, userID, "", "expense", "#ffffff", "icon")
	if err == nil {
		t.Errorf("expected error for empty name, got nil")
	}

	// 2. Invalid category type should fail
	_, err = svc.CreateCategory(ctx, userID, "Gasto Válido", "invalid_type", "#ffffff", "icon")
	if err == nil {
		t.Errorf("expected error for invalid category type, got nil")
	}

	// 3. Valid category should succeed
	created, err := svc.CreateCategory(ctx, userID, "Suscripciones Software", "expense", "#6366f1", "code")
	if err != nil {
		t.Fatalf("failed to create valid category: %v", err)
	}
	if created.Name != "Suscripciones Software" {
		t.Errorf("expected name 'Suscripciones Software', got: %s", created.Name)
	}

	// 4. Duplicate category should fail
	_, err = svc.CreateCategory(ctx, userID, "Suscripciones Software", "expense", "#6366f1", "code")
	if err == nil {
		t.Errorf("expected duplicate category error, got nil")
	}
}

func TestCategoryService_DeleteCategory_PreventSystemCategory(t *testing.T) {
	catRepo := &MockCategoryRepository{}
	expRepo := &MockExpenseRepository{}
	incRepo := &MockIncomeRepository{}
	svc := services.NewCategoryService(catRepo, expRepo, incRepo)

	ctx := context.Background()
	// Trying to delete a system default category ID
	_, err := svc.DeleteCategory(ctx, "default-exp-1", "user-cat-3", "")
	if err == nil {
		t.Errorf("expected error when deleting default system category, got nil")
	}
}

func TestCategoryService_DeleteCategory_WithReassignment(t *testing.T) {
	customCat := models.Category{
		ID:        "custom-cat-to-delete",
		UserID:    "user-cat-4",
		Name:      "Comida Rápida",
		Type:      "expense",
		CreatedAt: time.Now(),
	}
	catRepo := &MockCategoryRepository{
		categories: []models.Category{customCat},
	}
	expRepo := &MockExpenseRepository{
		expenses: []models.Expense{
			{
				ID:       "exp-1",
				UserID:   "user-cat-4",
				Amount:   25.00,
				Category: "Comida Rápida",
			},
		},
	}
	incRepo := &MockIncomeRepository{}
	svc := services.NewCategoryService(catRepo, expRepo, incRepo)

	ctx := context.Background()

	// 1. Delete without reassignTo when category is in use -> should return CategoryInUseError
	_, err := svc.DeleteCategory(ctx, "custom-cat-to-delete", "user-cat-4", "")
	if err == nil {
		t.Fatalf("expected CategoryInUseError, got nil")
	}
	var inUseErr *services.CategoryInUseError
	if !errors.As(err, &inUseErr) {
		t.Errorf("expected error to be *services.CategoryInUseError, got: %T", err)
	}

	// 2. Delete WITH reassignTo -> should succeed and reassign expense
	res, err := svc.DeleteCategory(ctx, "custom-cat-to-delete", "user-cat-4", "Alimentación")
	if err != nil {
		t.Fatalf("failed to delete with reassignment: %v", err)
	}
	if !res.Reassigned {
		t.Errorf("expected Reassigned=true")
	}
	if res.ReassignedCount != 1 {
		t.Errorf("expected ReassignedCount=1, got: %d", res.ReassignedCount)
	}

	// Verify expense category was updated
	expenses, _ := expRepo.FindByUserID(ctx, "user-cat-4")
	if len(expenses) != 1 || expenses[0].Category != "Alimentación" {
		t.Errorf("expected expense category to be reassigned to 'Alimentación'")
	}
}
