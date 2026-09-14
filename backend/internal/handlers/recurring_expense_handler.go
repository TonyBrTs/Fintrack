package handlers

import (
	"net/http"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type RecurringExpenseHandler struct {
	service services.RecurringExpenseService
}

func NewRecurringExpenseHandler(service services.RecurringExpenseService) *RecurringExpenseHandler {
	return &RecurringExpenseHandler{service: service}
}

func (h *RecurringExpenseHandler) GetRecurringExpenses(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	items, err := h.service.GetRecurringExpenses(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recurring expenses"})
		return
	}
	ctx.JSON(http.StatusOK, items)
}

func (h *RecurringExpenseHandler) CreateRecurringExpense(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	var item models.RecurringExpense
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.CreateRecurringExpense(ctx.Request.Context(), userID, &item)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, created)
}

func (h *RecurringExpenseHandler) UpdateRecurringExpense(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	var item models.RecurringExpense
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.UpdateRecurringExpense(ctx.Request.Context(), id, userID, &item)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Recurring expense not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, result)
}

func (h *RecurringExpenseHandler) DeleteRecurringExpense(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	err := h.service.DeleteRecurringExpense(ctx.Request.Context(), id, userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Recurring expense not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Recurring expense deleted successfully"})
}

// SyncDueExpenses processes any pending fixed expenses whose due date has arrived
func (h *RecurringExpenseHandler) SyncDueExpenses(ctx *gin.Context) {
	userID := ctx.GetString("userID")

	created, err := h.service.ProcessDueExpenses(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync recurring expenses"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"processed_count": len(created),
		"expenses":        created,
	})
}

// ExecuteNow forces execution of a scheduled recurring expense ahead of time
func (h *RecurringExpenseHandler) ExecuteNow(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	created, err := h.service.ExecuteNow(ctx.Request.Context(), id, userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Expense registered successfully",
		"expense": created,
	})
}
