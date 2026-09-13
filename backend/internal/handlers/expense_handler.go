package handlers

import (
	"net/http"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type ExpenseHandler struct {
	service services.ExpenseService
}

func NewExpenseHandler(service services.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{service: service}
}

func (h *ExpenseHandler) GetExpenses(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	expenses, err := h.service.GetExpenses(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expenses"})
		return
	}
	ctx.JSON(http.StatusOK, expenses)
}

func (h *ExpenseHandler) CreateExpense(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	var newExpense models.Expense
	if err := ctx.ShouldBindJSON(&newExpense); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.CreateExpense(ctx.Request.Context(), userID, &newExpense)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create expense"})
		return
	}
	ctx.JSON(http.StatusCreated, created)
}

func (h *ExpenseHandler) UpdateExpense(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	var updatedExpense models.Expense
	if err := ctx.ShouldBindJSON(&updatedExpense); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.UpdateExpense(ctx.Request.Context(), id, userID, &updatedExpense)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Expense not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, result)
}

func (h *ExpenseHandler) DeleteExpense(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	if err := h.service.DeleteExpense(ctx.Request.Context(), id, userID); err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Expense not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusNoContent, nil)
}
