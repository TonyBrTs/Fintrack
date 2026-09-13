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

type mockGoalRepoForHandler struct {
	goals []models.Goal
}

func (m *mockGoalRepoForHandler) FindByUserID(ctx context.Context, userID string) ([]models.Goal, error) {
	var res []models.Goal
	for _, g := range m.goals {
		if g.UserID == userID {
			res = append(res, g)
		}
	}
	return res, nil
}

func (m *mockGoalRepoForHandler) Create(ctx context.Context, goal *models.Goal) error {
	m.goals = append(m.goals, *goal)
	return nil
}

func (m *mockGoalRepoForHandler) Update(ctx context.Context, id, userID string, goal *models.Goal) (*models.Goal, error) {
	for i, g := range m.goals {
		if g.ID == id && g.UserID == userID {
			m.goals[i] = *goal
			return goal, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockGoalRepoForHandler) Delete(ctx context.Context, id, userID string) error {
	for i, g := range m.goals {
		if g.ID == id && g.UserID == userID {
			m.goals = append(m.goals[:i], m.goals[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func setupGoalRouter(repo *mockGoalRepoForHandler, userID string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("userID", userID)
		c.Next()
	})

	svc := services.NewGoalService(repo)
	h := handlers.NewGoalHandler(svc)

	r.GET("/api/goals", h.GetGoals)
	r.POST("/api/goals", h.CreateGoal)
	r.PUT("/api/goals/:id", h.UpdateGoal)
	r.DELETE("/api/goals/:id", h.DeleteGoal)

	return r
}

func TestGoalHandler_GetAndCreate(t *testing.T) {
	repo := &mockGoalRepoForHandler{}
	router := setupGoalRouter(repo, "user-goal-http-1")

	// 1. GET /api/goals
	reqGet, _ := http.NewRequest(http.MethodGet, "/api/goals", nil)
	wGet := httptest.NewRecorder()
	router.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got: %d", wGet.Code)
	}

	// 2. POST /api/goals
	body := map[string]interface{}{
		"name":           "Viaje a Japón",
		"target_amount":  6000.00,
		"current_amount": 1000.00,
		"currency":       "USD",
		"category":       "Viajes",
		"deadline":       time.Now().AddDate(1, 0, 0).Format(time.RFC3339),
	}
	jsonBody, _ := json.Marshal(body)

	reqPost, _ := http.NewRequest(http.MethodPost, "/api/goals", bytes.NewBuffer(jsonBody))
	reqPost.Header.Set("Content-Type", "application/json")
	wPost := httptest.NewRecorder()
	router.ServeHTTP(wPost, reqPost)

	if wPost.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got: %d (%s)", wPost.Code, wPost.Body.String())
	}

	var created models.Goal
	if err := json.Unmarshal(wPost.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if created.TargetAmount != 6000.00 {
		t.Errorf("expected target amount 6000.00, got: %f", created.TargetAmount)
	}
}

func TestGoalHandler_UpdateAndDelete(t *testing.T) {
	repo := &mockGoalRepoForHandler{
		goals: []models.Goal{
			{
				ID:           "goal-target-1",
				UserID:       "user-goal-http-2",
				Name:         "Laptop nueva",
				TargetAmount: 1800.00,
			},
		},
	}
	router := setupGoalRouter(repo, "user-goal-http-2")

	// 1. PUT update
	updateBody, _ := json.Marshal(map[string]interface{}{
		"name":           "Laptop nueva Pro",
		"target_amount":  2200.00,
		"current_amount": 500.00,
	})
	reqPut, _ := http.NewRequest(http.MethodPut, "/api/goals/goal-target-1", bytes.NewBuffer(updateBody))
	reqPut.Header.Set("Content-Type", "application/json")
	wPut := httptest.NewRecorder()
	router.ServeHTTP(wPut, reqPut)

	if wPut.Code != http.StatusOK {
		t.Errorf("expected 200 OK on update, got: %d", wPut.Code)
	}

	// 2. DELETE
	reqDel, _ := http.NewRequest(http.MethodDelete, "/api/goals/goal-target-1", nil)
	wDel := httptest.NewRecorder()
	router.ServeHTTP(wDel, reqDel)

	if wDel.Code != http.StatusOK {
		t.Errorf("expected 200 OK on delete, got: %d", wDel.Code)
	}
}
