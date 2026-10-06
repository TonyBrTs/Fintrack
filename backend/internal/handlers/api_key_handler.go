package handlers

import (
	"net/http"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type APIKeyHandler struct {
	service services.APIKeyService
}

func NewAPIKeyHandler(service services.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{service: service}
}

func (h *APIKeyHandler) GetKeys(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	keys, err := h.service.GetKeys(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener las API Keys"})
		return
	}
	ctx.JSON(http.StatusOK, keys)
}

func (h *APIKeyHandler) CreateKey(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	var input models.CreateAPIKeyInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "El nombre de la clave API es obligatorio"})
		return
	}

	created, err := h.service.CreateKey(ctx.Request.Context(), userID, input.Name)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, created)
}

func (h *APIKeyHandler) DeleteKey(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	if err := h.service.DeleteKey(ctx.Request.Context(), id, userID); err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Clave API no encontrada o no autorizada"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Clave API revocada exitosamente"})
}
