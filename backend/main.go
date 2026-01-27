package main

import (
	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

func main() {
	r := gin.Default()

	// Simple CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
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
		expenses := []models.Expense{
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

		c.JSON(http.StatusOK, expenses)
	})

	r.Run(":8080")
}
