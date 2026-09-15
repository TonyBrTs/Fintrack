package handlers

import (
	"net/http"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type RecurringIncomeHandler struct {
	service services.RecurringIncomeService
}

func NewRecurringIncomeHandler(service services.RecurringIncomeService) *RecurringIncomeHandler {
	return &RecurringIncomeHandler{service: service}
}

func (h *RecurringIncomeHandler) GetRecurringIncomes(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	items, err := h.service.GetRecurringIncomes(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recurring incomes"})
		return
	}
	ctx.JSON(http.StatusOK, items)
}

func (h *RecurringIncomeHandler) CreateRecurringIncome(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	var item models.RecurringIncome
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.CreateRecurringIncome(ctx.Request.Context(), userID, &item)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, created)
}

func (h *RecurringIncomeHandler) UpdateRecurringIncome(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	var item models.RecurringIncome
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.UpdateRecurringIncome(ctx.Request.Context(), id, userID, &item)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Recurring income not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, result)
}

func (h *RecurringIncomeHandler) DeleteRecurringIncome(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	err := h.service.DeleteRecurringIncome(ctx.Request.Context(), id, userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Recurring income not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Recurring income deleted successfully"})
}

// SyncDueIncomes processes any pending fixed incomes whose due date has arrived
func (h *RecurringIncomeHandler) SyncDueIncomes(ctx *gin.Context) {
	userID := ctx.GetString("userID")

	var clientDate *time.Time
	if clientDateStr := ctx.Query("client_date"); clientDateStr != "" {
		if t, err := time.Parse("2006-01-02", clientDateStr); err == nil {
			clientDate = &t
		}
	} else if headerDate := ctx.GetHeader("X-Client-Date"); headerDate != "" {
		if t, err := time.Parse("2006-01-02", headerDate); err == nil {
			clientDate = &t
		}
	}

	var created []models.Income
	var err error
	if clientDate != nil {
		created, err = h.service.ProcessDueIncomes(ctx.Request.Context(), userID, *clientDate)
	} else {
		created, err = h.service.ProcessDueIncomes(ctx.Request.Context(), userID)
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync recurring incomes"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"processed_count": len(created),
		"incomes":         created,
	})
}

// ExecuteNow forces collection/registration of a scheduled recurring income ahead of time
func (h *RecurringIncomeHandler) ExecuteNow(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	created, err := h.service.ExecuteNow(ctx.Request.Context(), id, userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Income registered successfully",
		"income":  created,
	})
}
