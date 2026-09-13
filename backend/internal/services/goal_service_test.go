package services_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

// MockGoalRepository implements repository.GoalRepository for unit testing.
type MockGoalRepository struct {
	goals    []models.Goal
	errToRet error
}

func (m *MockGoalRepository) FindByUserID(ctx context.Context, userID string) ([]models.Goal, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	var res []models.Goal
	for _, g := range m.goals {
		if g.UserID == userID {
			res = append(res, g)
		}
	}
	return res, nil
}

func (m *MockGoalRepository) Create(ctx context.Context, goal *models.Goal) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	m.goals = append(m.goals, *goal)
	return nil
}

func (m *MockGoalRepository) Update(ctx context.Context, id, userID string, goal *models.Goal) (*models.Goal, error) {
	if m.errToRet != nil {
		return nil, m.errToRet
	}
	for i, g := range m.goals {
		if g.ID == id && g.UserID == userID {
			m.goals[i] = *goal
			return goal, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *MockGoalRepository) Delete(ctx context.Context, id, userID string) error {
	if m.errToRet != nil {
		return m.errToRet
	}
	for i, g := range m.goals {
		if g.ID == id && g.UserID == userID {
			m.goals = append(m.goals[:i], m.goals[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func TestGoalService_CreateWithDefaultDeadline(t *testing.T) {
	mockRepo := &MockGoalRepository{}
	svc := services.NewGoalService(mockRepo)

	ctx := context.Background()
	userID := "user-goal-test-1"

	newGoal := &models.Goal{
		Name:          "Fondo de Emergencia",
		TargetAmount:  5000.00,
		CurrentAmount: 1500.00,
		Category:      "Ahorro",
	}

	created, err := svc.CreateGoal(ctx, userID, newGoal)
	if err != nil {
		t.Fatalf("expected nil error, got: %v", err)
	}
	if created.ID == "" {
		t.Errorf("expected auto-generated ID, got empty string")
	}
	if created.UserID != userID {
		t.Errorf("expected userID %s, got: %s", userID, created.UserID)
	}
	if created.Deadline.Before(time.Now()) {
		t.Errorf("expected future default deadline (+6 months), got: %v", created.Deadline)
	}

	goals, err := svc.GetGoals(ctx, userID)
	if err != nil {
		t.Fatalf("failed to retrieve goals: %v", err)
	}
	if len(goals) != 1 {
		t.Fatalf("expected 1 goal, got: %d", len(goals))
	}
	if goals[0].TargetAmount != 5000.00 {
		t.Errorf("expected target amount 5000.00, got: %f", goals[0].TargetAmount)
	}
}

func TestGoalService_Update(t *testing.T) {
	mockRepo := &MockGoalRepository{}
	svc := services.NewGoalService(mockRepo)

	ctx := context.Background()
	userID := "user-goal-test-2"

	created, _ := svc.CreateGoal(ctx, userID, &models.Goal{
		Name:          "Vacaciones",
		TargetAmount:  2000.00,
		CurrentAmount: 500.00,
	})

	updatePayload := &models.Goal{
		ID:            created.ID,
		UserID:        userID,
		Name:          "Vacaciones de Verano",
		TargetAmount:  2500.00,
		CurrentAmount: 1200.00,
	}

	updated, err := svc.UpdateGoal(ctx, created.ID, userID, updatePayload)
	if err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if updated.CurrentAmount != 1200.00 {
		t.Errorf("expected current amount 1200.00, got: %f", updated.CurrentAmount)
	}
}

func TestGoalService_Delete(t *testing.T) {
	mockRepo := &MockGoalRepository{}
	svc := services.NewGoalService(mockRepo)

	ctx := context.Background()
	userID := "user-goal-test-3"

	created, _ := svc.CreateGoal(ctx, userID, &models.Goal{
		Name:         "Auto Nuevo",
		TargetAmount: 15000.00,
	})

	if err := svc.DeleteGoal(ctx, created.ID, userID); err != nil {
		t.Fatalf("delete failed: %v", err)
	}

	goals, _ := svc.GetGoals(ctx, userID)
	if len(goals) != 0 {
		t.Errorf("expected 0 goals after deletion, got: %d", len(goals))
	}
}
