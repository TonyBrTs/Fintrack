package handlers

import (
	"net/http"
	"strings"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/gin-gonic/gin"
)

type PaymentMethodHandler struct{}

func NewPaymentMethodHandler() *PaymentMethodHandler {
	return &PaymentMethodHandler{}
}

// GetPaymentMethods returns payment methods with ID and Name.
// Supports query parameter ?type=expense or ?type=income
func (h *PaymentMethodHandler) GetPaymentMethods(ctx *gin.Context) {
	methodType := strings.ToLower(strings.TrimSpace(ctx.Query("type")))

	switch methodType {
	case "expense", "gasto", "expenses", "gastos":
		ctx.JSON(http.StatusOK, models.ExpensePaymentMethodOptions)
	case "income", "ingreso", "incomes", "ingresos":
		ctx.JSON(http.StatusOK, models.IncomePaymentMethodOptions)
	default:
		ctx.JSON(http.StatusOK, gin.H{
			"expense_methods": models.ExpensePaymentMethodOptions,
			"income_methods":  models.IncomePaymentMethodOptions,
		})
	}
}
