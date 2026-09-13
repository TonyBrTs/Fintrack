package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	service services.CategoryService
}

func NewCategoryHandler(service services.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) GetCategories(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	catType := ctx.Query("type")

	categories, err := h.service.GetCategories(ctx.Request.Context(), userID, catType)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No fue posible cargar las categorías"})
		return
	}
	ctx.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) CreateCategory(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	var req struct {
		Name  string `json:"name"`
		Type  string `json:"type"`
		Color string `json:"color"`
		Icon  string `json:"icon"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Información de categoría inválida"})
		return
	}

	created, err := h.service.CreateCategory(ctx.Request.Context(), userID, req.Name, req.Type, req.Color, req.Icon)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "el nombre de la categoría es requerido" ||
			errMsg == "el nombre de la categoría no debe exceder 50 caracteres" ||
			errMsg == "ya existe una categoría del sistema con ese nombre" ||
			errMsg == "ya tienes una categoría creada con este nombre" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No fue posible guardar la categoría"})
		return
	}

	ctx.JSON(http.StatusCreated, created)
}

func (h *CategoryHandler) DeleteCategory(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")
	reassignTo := strings.TrimSpace(ctx.Query("reassignTo"))

	result, err := h.service.DeleteCategory(ctx.Request.Context(), id, userID, reassignTo)
	if err != nil {
		var inUseErr *services.CategoryInUseError
		if errors.As(err, &inUseErr) {
			ctx.JSON(http.StatusConflict, gin.H{
				"error":         fmt.Sprintf("Esta categoría está asociada a %d transacción(es). Puedes reasignarlas antes de eliminarla.", inUseErr.Count),
				"in_use":        true,
				"count":         inUseErr.Count,
				"category_name": inUseErr.CategoryName,
				"category_type": inUseErr.CategoryType,
			})
			return
		}

		errMsg := err.Error()
		if errMsg == "las categorías del sistema no se pueden eliminar" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
			return
		}
		if errMsg == "categoría no encontrada o no autorizada" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": errMsg})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{"error": errMsg})
		return
	}

	ctx.JSON(http.StatusOK, result)
}
