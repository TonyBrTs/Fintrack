package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/handlers"
	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type mockExpenseRepoForHandler struct {
	expenses []models.Expense
}

func (m *mockExpenseRepoForHandler) FindByUserID(ctx context.Context, userID string) ([]models.Expense, error) {
	var res []models.Expense
	for _, e := range m.expenses {
		if e.UserID == userID {
			res = append(res, e)
		}
	}
	return res, nil
}

func (m *mockExpenseRepoForHandler) Create(ctx context.Context, expense *models.Expense) error {
	m.expenses = append(m.expenses, *expense)
	return nil
}

func (m *mockExpenseRepoForHandler) Update(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error) {
	for i, e := range m.expenses {
		if e.ID == id && e.UserID == userID {
			expense.ID = id
			expense.UserID = userID
			m.expenses[i] = *expense
			return expense, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockExpenseRepoForHandler) Delete(ctx context.Context, id, userID string) error {
	for i, e := range m.expenses {
		if e.ID == id && e.UserID == userID {
			m.expenses = append(m.expenses[:i], m.expenses[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func (m *mockExpenseRepoForHandler) CountByCategory(ctx context.Context, userID, category string) (int64, error) {
	var count int64
	for _, e := range m.expenses {
		if e.UserID == userID && e.Category == category {
			count++
		}
	}
	return count, nil
}

func (m *mockExpenseRepoForHandler) ReassignCategory(ctx context.Context, userID, oldCat, newCat string) error {
	return nil
}

func setupExpenseRouter(repo *mockExpenseRepoForHandler, userID string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", userID)
		c.Next()
	})

	svc := services.NewExpenseService(repo)
	h := handlers.NewExpenseHandler(svc)

	r.GET("/api/expenses", h.GetExpenses)
	r.POST("/api/expenses", h.CreateExpense)
	r.PUT("/api/expenses/:id", h.UpdateExpense)
	r.DELETE("/api/expenses/:id", h.DeleteExpense)

	return r
}

func TestExpenseHandler_GetAndCreate(t *testing.T) {
	repo := &mockExpenseRepoForHandler{}
	router := setupExpenseRouter(repo, "user-http-1")

	// 1. Initially GET should return empty array
	reqGet, _ := http.NewRequest(http.MethodGet, "/api/expenses", nil)
	wGet := httptest.NewRecorder()
	router.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got: %d", wGet.Code)
	}

	// 2. POST /api/expenses with valid JSON
	body := map[string]interface{}{
		"amount":         85.50,
		"currency":       "USD",
		"category":       "Alimentación",
		"description":    "Cena familiar",
		"payment_method": "Tarjeta",
		"date":           time.Now().Format(time.RFC3339),
	}
	jsonBody, _ := json.Marshal(body)

	reqPost, _ := http.NewRequest(http.MethodPost, "/api/expenses", bytes.NewBuffer(jsonBody))
	reqPost.Header.Set("Content-Type", "application/json")
	wPost := httptest.NewRecorder()
	router.ServeHTTP(wPost, reqPost)

	if wPost.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got: %d (%s)", wPost.Code, wPost.Body.String())
	}

	var created models.Expense
	if err := json.Unmarshal(wPost.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if created.Amount != 85.50 {
		t.Errorf("expected amount 85.50, got: %f", created.Amount)
	}
}

func TestExpenseHandler_Create_InvalidJSON(t *testing.T) {
	repo := &mockExpenseRepoForHandler{}
	router := setupExpenseRouter(repo, "user-http-2")

	req, _ := http.NewRequest(http.MethodPost, "/api/expenses", bytes.NewBufferString("{invalid-json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for malformed JSON, got: %d", w.Code)
	}
}

func TestExpenseHandler_UpdateAndDelete(t *testing.T) {
	repo := &mockExpenseRepoForHandler{
		expenses: []models.Expense{
			{
				ID:          "exp-http-target",
				UserID:      "user-http-3",
				Amount:      50.00,
				Category:    "Transporte",
				Description: "Gasolina",
			},
		},
	}
	router := setupExpenseRouter(repo, "user-http-3")

	// 1. PUT update
	updateBody, _ := json.Marshal(map[string]interface{}{
		"amount":      65.00,
		"category":    "Transporte",
		"description": "Gasolina premium",
	})
	reqPut, _ := http.NewRequest(http.MethodPut, "/api/expenses/exp-http-target", bytes.NewBuffer(updateBody))
	reqPut.Header.Set("Content-Type", "application/json")
	wPut := httptest.NewRecorder()
	router.ServeHTTP(wPut, reqPut)

	if wPut.Code != http.StatusOK {
		t.Errorf("expected 200 OK on update, got: %d", wPut.Code)
	}

	// 2. DELETE
	reqDel, _ := http.NewRequest(http.MethodDelete, "/api/expenses/exp-http-target", nil)
	wDel := httptest.NewRecorder()
	router.ServeHTTP(wDel, reqDel)

	if wDel.Code != http.StatusNoContent && wDel.Code != http.StatusOK {
		t.Errorf("expected 204 No Content or 200 OK on delete, got: %d", wDel.Code)
	}

	// 3. DELETE nonexistent -> should return 404
	reqDelNotFound, _ := http.NewRequest(http.MethodDelete, "/api/expenses/nonexistent-id", nil)
	wDelNotFound := httptest.NewRecorder()
	router.ServeHTTP(wDelNotFound, reqDelNotFound)

	if wDelNotFound.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found on nonexistent delete, got: %d", wDelNotFound.Code)
	}
}
