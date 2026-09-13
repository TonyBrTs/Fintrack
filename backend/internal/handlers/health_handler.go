package handlers

import (
	"net/http"

	"github.com/TonyBrTs/fintrack-backend/internal/database"
	"github.com/gin-gonic/gin"
)

func HealthCheck(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{
		"status":   "healthy",
		"database": database.DB != nil,
	})
}
