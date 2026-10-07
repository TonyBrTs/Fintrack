package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Standard payment methods supported in FinTrack
var ExpensePaymentMethods = []string{
	"Tarjeta de Crédito",
	"Tarjeta de Débito",
	"Efectivo",
	"Transferencia",
	"Automático (API)",
	"PayPal",
	"SINPE Móvil",
	"Depósito Bancario",
	"Otro",
}

var IncomePaymentMethods = []string{
	"Transferencia",
	"Efectivo",
	"Depósito Bancario",
	"Automático (API)",
	"PayPal",
	"SINPE Móvil",
	"Cheque",
	"Otro",
}

type PaymentMethodHandler struct{}

func NewPaymentMethodHandler() *PaymentMethodHandler {
	return &PaymentMethodHandler{}
}

// GetPaymentMethods returns standard payment methods.
// Supports query parameter ?type=expense or ?type=income
func (h *PaymentMethodHandler) GetPaymentMethods(ctx *gin.Context) {
	methodType := strings.ToLower(strings.TrimSpace(ctx.Query("type")))

	switch methodType {
	case "expense", "gasto", "expenses", "gastos":
		ctx.JSON(http.StatusOK, ExpensePaymentMethods)
	case "income", "ingreso", "incomes", "ingresos":
		ctx.JSON(http.StatusOK, IncomePaymentMethods)
	default:
		ctx.JSON(http.StatusOK, gin.H{
			"expense_methods": ExpensePaymentMethods,
			"income_methods":  IncomePaymentMethods,
		})
	}
}
