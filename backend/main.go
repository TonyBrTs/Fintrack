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

const storageFile = "expenses.json"

var expenses = []models.Expense{}

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
		log.Printf("Error reading file: %v", err)
		return
	}

	err = json.Unmarshal(data, &expenses)
	if err != nil {
		log.Printf("Error unmarshaling data: %v", err)
	}
}

func saveExpenses() {
	data, err := json.MarshalIndent(expenses, "", "  ")
	if err != nil {
		log.Printf("Error marshaling data: %v", err)
		return
	}

	err = os.WriteFile(storageFile, data, 0644)
	if err != nil {
		log.Printf("Error writing file: %v", err)
	}
}

func main() {
	loadExpenses()
	r := gin.Default()

	// Simple CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	r.GET("/api/expenses", func(c *gin.Context) {
		c.JSON(http.StatusOK, expenses)
	})

	r.POST("/api/expenses", func(c *gin.Context) {
		var newExpense models.Expense
		if err := c.ShouldBindJSON(&newExpense); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Basic validation/defaults
		newExpense.ID = time.Now().Format("20060102150405")
		if newExpense.Date.IsZero() {
			newExpense.Date = time.Now()
		}

		expenses = append([]models.Expense{newExpense}, expenses...) // Prepend for UI freshness
		saveExpenses()
		c.JSON(http.StatusCreated, newExpense)
	})

	r.PUT("/api/expenses/:id", func(c *gin.Context) {
		id := c.Param("id")
		var updatedExpense models.Expense
		if err := c.ShouldBindJSON(&updatedExpense); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		found := false
		for i, e := range expenses {
			if e.ID == id {
				updatedExpense.ID = id // Keep the same ID
				if updatedExpense.Date.IsZero() {
					updatedExpense.Date = e.Date
				}
				expenses[i] = updatedExpense
				found = true
				break
			}
		}

		if !found {
			c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
			return
		}

		saveExpenses()
		c.JSON(http.StatusOK, updatedExpense)
	})

	r.DELETE("/api/expenses/:id", func(c *gin.Context) {
		id := c.Param("id")
		found := false
		for i, e := range expenses {
			if e.ID == id {
				expenses = append(expenses[:i], expenses[i+1:]...)
				found = true
				break
			}
		}

		if !found {
			c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
			return
		}

		saveExpenses()
		c.JSON(http.StatusNoContent, nil)
	})

	r.Run("0.0.0.0:8080")
}
