package main

import (
	"encoding/json"
	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"os"
	"time"
)

const (
	storageFile        = "expenses.json"
	incomeStorageFile = "incomes.json"
	goalsStorageFile  = "goals.json"
)

var (
	expenses = []models.Expense{}
	incomes  = []models.Income{}
	goals    = []models.Goal{}
)

func loadExpenses() {
	if _, err := os.Stat(storageFile); os.IsNotExist(err) {
		// Default mock data if file doesn't exist
		expenses = []models.Expense{
			{
				ID:            "1",
				Amount:        45.5,
				Currency:      "USD",
				Description:   "Almuerzo de negocios",
				Category:      "Alimentación",
				Date:          time.Now().AddDate(0, 0, -1),
				PaymentMethod: "Tarjeta de Crédito",
			},
			{
				ID:            "2",
				Amount:        12.0,
				Currency:      "USD",
				Description:   "Uber al aeropuerto",
				Category:      "Transporte",
				Date:          time.Now().AddDate(0, 0, -2),
				PaymentMethod: "Efectivo",
			},
			{
				ID:            "3",
				Amount:        85.0,
				Currency:      "USD",
				Description:   "Suscripción Netflix y Spotify",
				Category:      "Entretenimiento",
				Date:          time.Now().AddDate(0, 0, -3),
				PaymentMethod: "Débito",
			},
			{
				ID:            "4",
				Amount:        120.0,
				Currency:      "USD",
				Description:   "Pago de luz y agua",
				Category:      "Servicios",
				Date:          time.Now().AddDate(0, 0, -5),
				PaymentMethod: "Transferencia",
			},
			{
				ID:            "5",
				Amount:        30.0,
				Currency:      "USD",
				Description:   "Farmacia",
				Category:      "Salud",
				Date:          time.Now().AddDate(0, 0, -6),
				PaymentMethod: "Tarjeta de Crédito",
			},
		}
		saveExpenses()
		return
	}

	data, err := os.ReadFile(storageFile)
	if err != nil {
		log.Printf("Error reading expenses file: %v", err)
		return
	}

	err = json.Unmarshal(data, &expenses)
	if err != nil {
		log.Printf("Error unmarshaling expenses data: %v", err)
	}
}

func loadIncomes() {
	if _, err := os.Stat(incomeStorageFile); os.IsNotExist(err) {
		// Default mock data if file doesn't exist
		incomes = []models.Income{
			{
				ID:            "1",
				Amount:        2500.0,
				Currency:      "USD",
				Description:   "Salario mensual",
				Source:        "Salario",
				Date:          time.Now().AddDate(0, 0, -10),
				PaymentMethod: "Transferencia",
			},
			{
				ID:            "2",
				Amount:        400.0,
				Currency:      "USD",
				Description:   "Proyecto Freelance Logo",
				Source:        "Freelance",
				Date:          time.Now().AddDate(0, 0, -5),
				PaymentMethod: "PayPal",
			},
		}
		saveIncomes()
		return
	}

	data, err := os.ReadFile(incomeStorageFile)
	if err != nil {
		log.Printf("Error reading incomes file: %v", err)
		return
	}

	err = json.Unmarshal(data, &incomes)
	if err != nil {
		log.Printf("Error unmarshaling incomes data: %v", err)
	}
}

func saveExpenses() {
	data, err := json.MarshalIndent(expenses, "", "  ")
	if err != nil {
		log.Printf("Error marshaling expenses data: %v", err)
		return
	}

	err = os.WriteFile(storageFile, data, 0644)
	if err != nil {
		log.Printf("Error writing expenses file: %v", err)
	}
}

func loadGoals() {
	if _, err := os.Stat(goalsStorageFile); os.IsNotExist(err) {
		// Default mock data
		goals = []models.Goal{
			{
				ID:            "1",
				Name:          "Fondo de Emergencia",
				TargetAmount:  5000.0,
				CurrentAmount: 1200.0,
				Deadline:      time.Now().AddDate(1, 0, 0),
				Category:      "Ahorro",
			},
			{
				ID:            "2",
				Name:          "Viaje a Japón",
				TargetAmount:  3000.0,
				CurrentAmount: 450.0,
				Deadline:      time.Now().AddDate(0, 6, 0),
				Category:      "Viajes",
			},
		}
		saveGoals()
		return
	}

	data, err := os.ReadFile(goalsStorageFile)
	if err != nil {
		log.Printf("Error reading goals file: %v", err)
		return
	}

	err = json.Unmarshal(data, &goals)
	if err != nil {
		log.Printf("Error unmarshaling goals data: %v", err)
	}
}

func saveGoals() {
	data, err := json.MarshalIndent(goals, "", "  ")
	if err != nil {
		log.Printf("Error marshaling goals data: %v", err)
		return
	}

	err = os.WriteFile(goalsStorageFile, data, 0644)
	if err != nil {
		log.Printf("Error writing goals file: %v", err)
	}
}

func saveIncomes() {
	data, err := json.MarshalIndent(incomes, "", "  ")
	if err != nil {
		log.Printf("Error marshaling incomes data: %v", err)
		return
	}

	err = os.WriteFile(incomeStorageFile, data, 0644)
	if err != nil {
		log.Printf("Error writing incomes file: %v", err)
	}
}

func main() {
	loadExpenses()
	loadIncomes()
	loadGoals()
	router := gin.Default()

	// Simple CORS Middleware
	router.Use(func(ctx *gin.Context) {
		ctx.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		ctx.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		ctx.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if ctx.Request.Method == "OPTIONS" {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}
		ctx.Next()
	})

	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	router.GET("/api/expenses", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, expenses)
	})

	router.POST("/api/expenses", func(ctx *gin.Context) {
		var newExpense models.Expense
		if err := ctx.ShouldBindJSON(&newExpense); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Basic validation/defaults
		newExpense.ID = time.Now().Format("20060102150405")
		if newExpense.Date.IsZero() {
			newExpense.Date = time.Now()
		}

		expenses = append([]models.Expense{newExpense}, expenses...) // Prepend for UI freshness
		saveExpenses()
		ctx.JSON(http.StatusCreated, newExpense)
	})

	router.PUT("/api/expenses/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		var updatedExpense models.Expense
		if err := ctx.ShouldBindJSON(&updatedExpense); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		found := false
		for i, expense := range expenses {
			if expense.ID == id {
				updatedExpense.ID = id // Keep the same ID
				if updatedExpense.Date.IsZero() {
					updatedExpense.Date = expense.Date
				}
				expenses[i] = updatedExpense
				found = true
				break
			}
		}

		if !found {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
			return
		}

		saveExpenses()
		ctx.JSON(http.StatusOK, updatedExpense)
	})

	router.DELETE("/api/expenses/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		found := false
		for i, expense := range expenses {
			if expense.ID == id {
				expenses = append(expenses[:i], expenses[i+1:]...)
				found = true
				break
			}
		}

		if !found {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
			return
		}

		saveExpenses()
		ctx.JSON(http.StatusNoContent, nil)
	})

	// --- INCOMES API ---
	router.GET("/api/incomes", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, incomes)
	})

	router.POST("/api/incomes", func(ctx *gin.Context) {
		var newIncome models.Income
		if err := ctx.ShouldBindJSON(&newIncome); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		newIncome.ID = time.Now().Format("20060102150405")
		if newIncome.Date.IsZero() {
			newIncome.Date = time.Now()
		}

		incomes = append([]models.Income{newIncome}, incomes...)
		saveIncomes()
		ctx.JSON(http.StatusCreated, newIncome)
	})

	router.PUT("/api/incomes/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		var updatedIncome models.Income
		if err := ctx.ShouldBindJSON(&updatedIncome); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		found := false
		for i, income := range incomes {
			if income.ID == id {
				updatedIncome.ID = id
				if updatedIncome.Date.IsZero() {
					updatedIncome.Date = income.Date
				}
				incomes[i] = updatedIncome
				found = true
				break
			}
		}

		if !found {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Income not found"})
			return
		}

		saveIncomes()
		ctx.JSON(http.StatusOK, updatedIncome)
	})

	router.DELETE("/api/incomes/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		found := false
		for i, income := range incomes {
			if income.ID == id {
				incomes = append(incomes[:i], incomes[i+1:]...)
				found = true
				break
			}
		}

		if !found {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Income not found"})
			return
		}

		saveIncomes()
		ctx.JSON(http.StatusNoContent, nil)
	})

	// --- GOALS API ---
	router.GET("/api/goals", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, goals)
	})

	router.POST("/api/goals", func(ctx *gin.Context) {
		var newGoal models.Goal
		if err := ctx.ShouldBindJSON(&newGoal); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		newGoal.ID = time.Now().Format("20060102150405")
		goals = append([]models.Goal{newGoal}, goals...)
		saveGoals()
		ctx.JSON(http.StatusCreated, newGoal)
	})

	router.PUT("/api/goals/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		var updatedGoal models.Goal
		if err := ctx.ShouldBindJSON(&updatedGoal); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		found := false
		for i, goal := range goals {
			if goal.ID == id {
				updatedGoal.ID = id
				goals[i] = updatedGoal
				found = true
				break
			}
		}

		if !found {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
			return
		}

		saveGoals()
		ctx.JSON(http.StatusOK, updatedGoal)
	})

	router.DELETE("/api/goals/:id", func(ctx *gin.Context) {
		id := ctx.Param("id")
		found := false
		for i, goal := range goals {
			if goal.ID == id {
				goals = append(goals[:i], goals[i+1:]...)
				found = true
				break
			}
		}

		if !found {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
			return
		}

		saveGoals()
		ctx.JSON(http.StatusNoContent, nil)
	})

	router.Run("0.0.0.0:8080")
}
