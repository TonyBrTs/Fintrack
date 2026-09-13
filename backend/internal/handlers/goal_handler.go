package handlers

import (
	"net/http"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type GoalHandler struct {
	service services.GoalService
}

func NewGoalHandler(service services.GoalService) *GoalHandler {
	return &GoalHandler{service: service}
}

func (h *GoalHandler) GetGoals(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	goals, err := h.service.GetGoals(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch goals"})
		return
	}
	ctx.JSON(http.StatusOK, goals)
}

func (h *GoalHandler) CreateGoal(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	var newGoal models.Goal
	if err := ctx.ShouldBindJSON(&newGoal); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.CreateGoal(ctx.Request.Context(), userID, &newGoal)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create goal"})
		return
	}
	ctx.JSON(http.StatusCreated, created)
}

func (h *GoalHandler) UpdateGoal(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	var updatedGoal models.Goal
	if err := ctx.ShouldBindJSON(&updatedGoal); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.UpdateGoal(ctx.Request.Context(), id, userID, &updatedGoal)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Goal not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, result)
}

func (h *GoalHandler) DeleteGoal(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	id := ctx.Param("id")

	if err := h.service.DeleteGoal(ctx.Request.Context(), id, userID); err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Goal not found or unauthorized"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Goal deleted successfully"})
}
