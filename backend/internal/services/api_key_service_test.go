package services_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
)

type MockAPIKeyRepository struct {
	keys []models.APIKey
}

func (m *MockAPIKeyRepository) FindByUserID(ctx context.Context, userID string) ([]models.APIKey, error) {
	var res []models.APIKey
	for _, k := range m.keys {
		if k.UserID == userID {
			res = append(res, k)
		}
	}
	return res, nil
}

func (m *MockAPIKeyRepository) FindByHash(ctx context.Context, keyHash string) (*models.APIKey, error) {
	for _, k := range m.keys {
		if k.KeyHash == keyHash && k.IsActive {
			cp := k
			return &cp, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *MockAPIKeyRepository) Create(ctx context.Context, key *models.APIKey) error {
	m.keys = append(m.keys, *key)
	return nil
}

func (m *MockAPIKeyRepository) Delete(ctx context.Context, id, userID string) error {
	for i, k := range m.keys {
		if k.ID == id && k.UserID == userID {
			m.keys = append(m.keys[:i], m.keys[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}

func (m *MockAPIKeyRepository) UpdateLastUsed(ctx context.Context, id string, lastUsed time.Time) error {
	for i, k := range m.keys {
		if k.ID == id {
			m.keys[i].LastUsedAt = &lastUsed
			return nil
		}
	}
	return nil
}

func TestAPIKeyService_CreateAndValidate(t *testing.T) {
	repo := &MockAPIKeyRepository{}
	svc := services.NewAPIKeyService(repo)
	ctx := context.Background()
	userID := "user-uuid-n8n"

	// 1. Create key
	res, err := svc.CreateKey(ctx, userID, "n8n Automation")
	if err != nil {
		t.Fatalf("unexpected error creating API key: %v", err)
	}

	if !strings.HasPrefix(res.PlainKey, "fntk_live_") {
		t.Errorf("expected plain key to start with 'fntk_live_', got '%s'", res.PlainKey)
	}

	if res.APIKey.KeyLast4 != res.PlainKey[len(res.PlainKey)-4:] {
		t.Errorf("expected last4 to match suffix of plain key, got %s vs %s", res.APIKey.KeyLast4, res.PlainKey[len(res.PlainKey)-4:])
	}

	// Verify plaintext is NOT stored in repo (only hash)
	if len(repo.keys) != 1 {
		t.Fatalf("expected 1 key in repo, got %d", len(repo.keys))
	}
	if repo.keys[0].KeyHash == res.PlainKey {
		t.Errorf("SECURITY RISK: plain key was stored directly instead of hash!")
	}

	// 2. Validate valid key
	validated, err := svc.ValidateKey(ctx, res.PlainKey)
	if err != nil {
		t.Fatalf("validation failed for valid plain key: %v", err)
	}
	if validated.UserID != userID {
		t.Errorf("expected userID '%s', got '%s'", userID, validated.UserID)
	}

	// 3. Validation fails for fake/tampered key
	_, err = svc.ValidateKey(ctx, "fntk_live_fake123456789")
	if err == nil {
		t.Errorf("expected validation error for invalid key, got nil")
	}

	// 4. Delete / Revoke key
	err = svc.DeleteKey(ctx, res.APIKey.ID, userID)
	if err != nil {
		t.Fatalf("failed to delete key: %v", err)
	}

	_, err = svc.ValidateKey(ctx, res.PlainKey)
	if err == nil {
		t.Errorf("expected revoked key validation to fail, got nil")
	}
}
