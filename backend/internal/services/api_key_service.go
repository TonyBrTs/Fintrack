package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
)

type apiKeyService struct {
	repo repository.APIKeyRepository
}

func NewAPIKeyService(repo repository.APIKeyRepository) APIKeyService {
	return &apiKeyService{repo: repo}
}

func (s *apiKeyService) GetKeys(ctx context.Context, userID string) ([]models.APIKey, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *apiKeyService) CreateKey(ctx context.Context, userID, name string) (*models.CreateAPIKeyResponse, error) {
	trimmedName := strings.TrimSpace(name)
	if trimmedName == "" {
		return nil, errors.New("el nombre de la API key es obligatorio")
	}
	if len(trimmedName) > 100 {
		return nil, errors.New("el nombre de la API key no debe exceder 100 caracteres")
	}

	// Generate 24 bytes of cryptographic randomness (48 hex chars)
	randomBytes := make([]byte, 24)
	if _, err := rand.Read(randomBytes); err != nil {
		return nil, fmt.Errorf("error al generar entropía criptográfica: %w", err)
	}

	tokenBody := hex.EncodeToString(randomBytes)
	fullPlainKey := "fntk_live_" + tokenBody

	// Compute SHA-256 hash of the full plain token for storage
	hasher := sha256.New()
	hasher.Write([]byte(fullPlainKey))
	keyHash := hex.EncodeToString(hasher.Sum(nil))

	keyID := fmt.Sprintf("key_%d", time.Now().UnixNano())
	last4 := fullPlainKey[len(fullPlainKey)-4:]

	apiKey := models.APIKey{
		ID:        keyID,
		UserID:    userID,
		Name:      trimmedName,
		KeyHash:   keyHash,
		KeyPrefix: "fntk_live_",
		KeyLast4:  last4,
		CreatedAt: time.Now().UTC(),
		IsActive:  true,
	}

	if err := s.repo.Create(ctx, &apiKey); err != nil {
		return nil, fmt.Errorf("error al guardar la API key: %w", err)
	}

	return &models.CreateAPIKeyResponse{
		APIKey:   apiKey,
		PlainKey: fullPlainKey,
	}, nil
}

func (s *apiKeyService) DeleteKey(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *apiKeyService) ValidateKey(ctx context.Context, rawKey string) (*models.APIKey, error) {
	cleanKey := strings.TrimSpace(rawKey)
	if cleanKey == "" {
		return nil, errors.New("api key vacía")
	}

	hasher := sha256.New()
	hasher.Write([]byte(cleanKey))
	keyHash := hex.EncodeToString(hasher.Sum(nil))

	key, err := s.repo.FindByHash(ctx, keyHash)
	if err != nil || key == nil {
		return nil, errors.New("api key no encontrada o inactiva")
	}

	if !key.IsActive {
		return nil, errors.New("esta api key ha sido desactivada")
	}

	if key.ExpiresAt != nil && time.Now().UTC().After(*key.ExpiresAt) {
		return nil, errors.New("esta api key ha expirado")
	}

	// Update last used timestamp in a background goroutine to minimize latency
	go func(id string) {
		_ = s.repo.UpdateLastUsed(context.Background(), id, time.Now().UTC())
	}(key.ID)

	return key, nil
}
