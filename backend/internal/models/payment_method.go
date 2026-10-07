package models

import (
	"strings"
)

// PaymentMethodOption defines an identifiable payment method with an ID and a human-readable Name.
type PaymentMethodOption struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"` // "expense" or "income"
}

// ExpensePaymentMethodOptions provides structured payment methods for expenses.
var ExpensePaymentMethodOptions = []PaymentMethodOption{
	{ID: "pm_tarjeta_credito", Name: "Tarjeta de Crédito", Type: "expense"},
	{ID: "pm_tarjeta_debito", Name: "Tarjeta de Débito", Type: "expense"},
	{ID: "pm_efectivo", Name: "Efectivo", Type: "expense"},
	{ID: "pm_transferencia", Name: "Transferencia", Type: "expense"},
	{ID: "pm_automatico", Name: "Automático (API)", Type: "expense"},
	{ID: "pm_paypal", Name: "PayPal", Type: "expense"},
	{ID: "pm_sinpe", Name: "SINPE Móvil", Type: "expense"},
	{ID: "pm_deposito", Name: "Depósito Bancario", Type: "expense"},
	{ID: "pm_otro", Name: "Otro", Type: "expense"},
}

// IncomePaymentMethodOptions provides structured payment methods for incomes.
var IncomePaymentMethodOptions = []PaymentMethodOption{
	{ID: "pm_transferencia", Name: "Transferencia", Type: "income"},
	{ID: "pm_efectivo", Name: "Efectivo", Type: "income"},
	{ID: "pm_deposito", Name: "Depósito Bancario", Type: "income"},
	{ID: "pm_automatico", Name: "Automático (API)", Type: "income"},
	{ID: "pm_paypal", Name: "PayPal", Type: "income"},
	{ID: "pm_sinpe", Name: "SINPE Móvil", Type: "income"},
	{ID: "pm_cheque", Name: "Cheque", Type: "income"},
	{ID: "pm_otro", Name: "Otro", Type: "income"},
}

// ResolvePaymentMethodName resolves either an ID (e.g. pm_tarjeta_credito) or a direct name to its canonical string.
func ResolvePaymentMethodName(input string) string {
	in := strings.ToLower(strings.TrimSpace(input))
	switch in {
	case "pm_tarjeta_credito", "tarjeta_credito", "credit_card":
		return "Tarjeta de Crédito"
	case "pm_tarjeta_debito", "tarjeta_debito", "debit_card":
		return "Tarjeta de Débito"
	case "pm_efectivo", "efectivo", "cash":
		return "Efectivo"
	case "pm_transferencia", "transferencia", "transfer":
		return "Transferencia"
	case "pm_automatico", "automatico", "api":
		return "Automático (API)"
	case "pm_paypal", "paypal":
		return "PayPal"
	case "pm_sinpe", "sinpe", "sinpe_movil":
		return "SINPE Móvil"
	case "pm_deposito", "deposito", "deposit":
		return "Depósito Bancario"
	case "pm_cheque", "cheque", "check":
		return "Cheque"
	case "pm_otro", "otro", "other":
		return "Otro"
	default:
		return strings.TrimSpace(input)
	}
}

// ResolveDefaultCategoryName resolves a category ID (e.g. default-exp-1) or name to its canonical name.
func ResolveDefaultCategoryName(input, catType string) string {
	in := strings.ToLower(strings.TrimSpace(input))
	if catType == "expense" {
		for _, c := range DefaultExpenseCategories {
			if strings.EqualFold(c.ID, in) || strings.EqualFold(c.Name, in) {
				return c.Name
			}
		}
	} else if catType == "income" {
		for _, c := range DefaultIncomeSources {
			if strings.EqualFold(c.ID, in) || strings.EqualFold(c.Name, in) {
				return c.Name
			}
		}
	}
	return ""
}
