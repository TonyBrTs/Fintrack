package handlers

import (
	"net/http"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type IncomeHandler struct {
	service services.IncomeService
}

func NewIncomeHandler(service services.IncomeService) *IncomeHandler {
	return &IncomeHandler{service: service}
}

func (h *IncomeHandler) GetIncomes(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	incomes, err := h.service.GetIncomes(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incomes"})
		return
	}
	ctx.JSON(http.StatusOK, incomes)
}

func (h *IncomeHandler) CreateIncome(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	var newIncome models.Income
	if err := ctx.ShouldBindJSON(&newIncome); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.CreateIncome(ctx.Request.Context(), userID, &newIncome)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create income"})
		return
	}
	ctx.JSON(http.StatusCreated, created)
}

func (h *IncomeHandler) UpdateIncome(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	var updatedIncome models.Income
	if err := ctx.ShouldBindJSON(&updatedIncome); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.UpdateIncome(ctx.Request.Context(), id, userID, &updatedIncome)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Income not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, result)
}

func (h *IncomeHandler) DeleteIncome(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	if err := h.service.DeleteIncome(ctx.Request.Context(), id, userID); err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Income not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Income deleted successfully"})
}
