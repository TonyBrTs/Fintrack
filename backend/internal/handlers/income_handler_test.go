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

type mockIncomeRepoForHandler struct {
	incomes []models.Income
}

func (m *mockIncomeRepoForHandler) FindByUserID(ctx context.Context, userID string) ([]models.Income, error) {
	var res []models.Income
	for _, inc := range m.incomes {
		if inc.UserID == userID {
			res = append(res, inc)
		}
	}
	return res, nil
}

func (m *mockIncomeRepoForHandler) Create(ctx context.Context, income *models.Income) error {
	m.incomes = append(m.incomes, *income)
	return nil
}

func (m *mockIncomeRepoForHandler) Update(ctx context.Context, id, userID string, income *models.Income) (*models.Income, error) {
	for i, inc := range m.incomes {
		if inc.ID == id && inc.UserID == userID {
			income.ID = id
			income.UserID = userID
			m.incomes[i] = *income
			return income, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockIncomeRepoForHandler) Delete(ctx context.Context, id, userID string) error {
	for i, inc := range m.incomes {
		if inc.ID == id && inc.UserID == userID {
			m.incomes = append(m.incomes[:i], m.incomes[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func (m *mockIncomeRepoForHandler) CountBySource(ctx context.Context, userID, source string) (int64, error) {
	var count int64
	for _, inc := range m.incomes {
		if inc.UserID == userID && inc.Source == source {
			count++
		}
	}
	return count, nil
}

func (m *mockIncomeRepoForHandler) ReassignSource(ctx context.Context, userID, oldSource, newSource string) error {
	return nil
}

func setupIncomeRouter(repo *mockIncomeRepoForHandler, userID string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", userID)
		c.Next()
	})

	svc := services.NewIncomeService(repo)
	h := handlers.NewIncomeHandler(svc)

	r.GET("/api/incomes", h.GetIncomes)
	r.POST("/api/incomes", h.CreateIncome)
	r.PUT("/api/incomes/:id", h.UpdateIncome)
	r.DELETE("/api/incomes/:id", h.DeleteIncome)

	return r
}

func TestIncomeHandler_GetAndCreate(t *testing.T) {
	repo := &mockIncomeRepoForHandler{}
	router := setupIncomeRouter(repo, "user-inc-1")

	// 1. GET returns 200 OK and empty array
	reqGet, _ := http.NewRequest(http.MethodGet, "/api/incomes", nil)
	wGet := httptest.NewRecorder()
	router.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got: %d", wGet.Code)
	}

	// 2. POST /api/incomes
	body := map[string]interface{}{
		"amount":      2000.00,
		"currency":    "USD",
		"source":      "Salario",
		"description": "Pago mensual",
		"date":        time.Now().Format(time.RFC3339),
	}
	jsonBody, _ := json.Marshal(body)

	reqPost, _ := http.NewRequest(http.MethodPost, "/api/incomes", bytes.NewBuffer(jsonBody))
	reqPost.Header.Set("Content-Type", "application/json")
	wPost := httptest.NewRecorder()
	router.ServeHTTP(wPost, reqPost)

	if wPost.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got: %d", wPost.Code)
	}

	var created models.Income
	if err := json.Unmarshal(wPost.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if created.Amount != 2000.00 {
		t.Errorf("expected amount 2000.00, got: %f", created.Amount)
	}
}

func TestIncomeHandler_UpdateAndDelete(t *testing.T) {
	repo := &mockIncomeRepoForHandler{
		incomes: []models.Income{
			{
				ID:     "inc-target-1",
				UserID: "user-inc-2",
				Amount: 100.00,
				Source: "Bono",
			},
		},
	}
	router := setupIncomeRouter(repo, "user-inc-2")

	// 1. PUT update
	updateBody, _ := json.Marshal(map[string]interface{}{
		"amount": 150.00,
		"source": "Bono de Rendimiento",
	})
	reqPut, _ := http.NewRequest(http.MethodPut, "/api/incomes/inc-target-1", bytes.NewBuffer(updateBody))
	reqPut.Header.Set("Content-Type", "application/json")
	wPut := httptest.NewRecorder()
	router.ServeHTTP(wPut, reqPut)

	if wPut.Code != http.StatusOK {
		t.Errorf("expected 200 OK on update, got: %d", wPut.Code)
	}

	// 2. DELETE
	reqDel, _ := http.NewRequest(http.MethodDelete, "/api/incomes/inc-target-1", nil)
	wDel := httptest.NewRecorder()
	router.ServeHTTP(wDel, reqDel)

	if wDel.Code != http.StatusNoContent && wDel.Code != http.StatusOK {
		t.Errorf("expected 204 No Content or 200 OK on delete, got: %d", wDel.Code)
	}
}
