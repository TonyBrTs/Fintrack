package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/handlers"
	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type mockCategoryRepoForHandler struct {
	categories []models.Category
}

func (m *mockCategoryRepoForHandler) FindByUserID(ctx context.Context, userID, catType string) ([]models.Category, error) {
	var res []models.Category
	for _, c := range m.categories {
		if c.UserID == userID && (catType == "" || c.Type == catType) {
			res = append(res, c)
		}
	}
	return res, nil
}

func (m *mockCategoryRepoForHandler) FindByNameAndType(ctx context.Context, userID, name, catType string) (*models.Category, error) {
	for _, c := range m.categories {
		if c.UserID == userID && c.Name == name && c.Type == catType {
			return &c, nil
		}
	}
	return nil, nil
}

func (m *mockCategoryRepoForHandler) FindByIDAndUserID(ctx context.Context, id, userID string) (*models.Category, error) {
	for _, c := range m.categories {
		if c.ID == id && c.UserID == userID {
			return &c, nil
		}
	}
	return nil, nil
}

func (m *mockCategoryRepoForHandler) Create(ctx context.Context, category *models.Category) error {
	m.categories = append(m.categories, *category)
	return nil
}

func (m *mockCategoryRepoForHandler) Delete(ctx context.Context, id, userID string) error {
	for i, c := range m.categories {
		if c.ID == id && c.UserID == userID {
			m.categories = append(m.categories[:i], m.categories[i+1:]...)
			return nil
		}
	}
	return nil
}

func setupCategoryRouter(catRepo *mockCategoryRepoForHandler, expRepo *mockExpenseRepoForHandler, incRepo *mockIncomeRepoForHandler, userID string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", userID)
		c.Next()
	})

	svc := services.NewCategoryService(catRepo, expRepo, incRepo)
	h := handlers.NewCategoryHandler(svc)

	r.GET("/api/categories", h.GetCategories)
	r.POST("/api/categories", h.CreateCategory)
	r.DELETE("/api/categories/:id", h.DeleteCategory)

	return r
}

func TestCategoryHandler_GetAndCreate(t *testing.T) {
	catRepo := &mockCategoryRepoForHandler{}
	expRepo := &mockExpenseRepoForHandler{}
	incRepo := &mockIncomeRepoForHandler{}
	router := setupCategoryRouter(catRepo, expRepo, incRepo, "user-cat-http-1")

	// 1. GET /api/categories?type=expense should return default system categories
	reqGet, _ := http.NewRequest(http.MethodGet, "/api/categories?type=expense", nil)
	wGet := httptest.NewRecorder()
	router.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got: %d", wGet.Code)
	}

	// 2. POST valid category
	body, _ := json.Marshal(map[string]string{
		"name":  "Mascotas",
		"type":  "expense",
		"color": "#10b981",
		"icon":  "paw",
	})
	reqPost, _ := http.NewRequest(http.MethodPost, "/api/categories", bytes.NewBuffer(body))
	reqPost.Header.Set("Content-Type", "application/json")
	wPost := httptest.NewRecorder()
	router.ServeHTTP(wPost, reqPost)

	if wPost.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got: %d (%s)", wPost.Code, wPost.Body.String())
	}

	// 3. POST invalid category (empty name) -> should return 400 Bad Request
	emptyBody, _ := json.Marshal(map[string]string{
		"name": "",
		"type": "expense",
	})
	reqInvalid, _ := http.NewRequest(http.MethodPost, "/api/categories", bytes.NewBuffer(emptyBody))
	reqInvalid.Header.Set("Content-Type", "application/json")
	wInvalid := httptest.NewRecorder()
	router.ServeHTTP(wInvalid, reqInvalid)

	if wInvalid.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for empty name, got: %d", wInvalid.Code)
	}
}

func TestCategoryHandler_DeleteInUseConflict(t *testing.T) {
	catID := "cat-in-use"
	catRepo := &mockCategoryRepoForHandler{
		categories: []models.Category{
			{
				ID:        catID,
				UserID:    "user-cat-http-2",
				Name:      "Gimnasio",
				Type:      "expense",
				CreatedAt: time.Now(),
			},
		},
	}
	// Expense repo where this category has 2 expenses
	expRepo := &mockExpenseRepoForHandler{
		expenses: []models.Expense{
			{ID: "exp-1", UserID: "user-cat-http-2", Category: "Gimnasio", Amount: 30},
			{ID: "exp-2", UserID: "user-cat-http-2", Category: "Gimnasio", Amount: 30},
		},
	}
	incRepo := &mockIncomeRepoForHandler{}
	router := setupCategoryRouter(catRepo, expRepo, incRepo, "user-cat-http-2")

	// 1. DELETE without reassignTo query param -> should return 409 Conflict
	reqDel, _ := http.NewRequest(http.MethodDelete, "/api/categories/"+catID, nil)
	wDel := httptest.NewRecorder()
	router.ServeHTTP(wDel, reqDel)

	if wDel.Code != http.StatusConflict {
		t.Fatalf("expected 409 Conflict when deleting category in use, got: %d", wDel.Code)
	}

	var conflictResp map[string]interface{}
	json.Unmarshal(wDel.Body.Bytes(), &conflictResp)
	if conflictResp["in_use"] != true {
		t.Errorf("expected in_use=true in response, got: %v", conflictResp["in_use"])
	}

	// 2. DELETE WITH reassignTo -> should succeed with 200 OK
	reqReassign, _ := http.NewRequest(http.MethodDelete, "/api/categories/"+catID+"?reassignTo=Salud", nil)
	wReassign := httptest.NewRecorder()
	router.ServeHTTP(wReassign, reqReassign)

	if wReassign.Code != http.StatusOK {
		t.Errorf("expected 200 OK on reassign delete, got: %d", wReassign.Code)
	}
}
