package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/database"
	"github.com/TonyBrTs/fintrack-backend/internal/middleware"
	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

const (
	storageFile           = "expenses.json"
	incomeStorageFile     = "incomes.json"
	goalsStorageFile      = "goals.json"
	categoriesStorageFile = "categories.json"
)

var (
	expenses     = []models.Expense{}
	incomes      = []models.Income{}
	goals        = []models.Goal{}
	categories   = []models.Category{}
	storageMutex sync.RWMutex
)

func loadExpenses() {
	if _, err := os.Stat(storageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(storageFile)
	if err != nil {
		log.Printf("Error reading expenses file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &expenses)
}

func saveExpenses() {
	storageMutex.Lock()
	defer storageMutex.Unlock()
	data, err := json.MarshalIndent(expenses, "", "  ")
	if err != nil {
		log.Printf("Error marshaling expenses data: %v", err)
		return
	}
	_ = os.WriteFile(storageFile, data, 0644)
}

func loadIncomes() {
	if _, err := os.Stat(incomeStorageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(incomeStorageFile)
	if err != nil {
		log.Printf("Error reading incomes file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &incomes)
}

func saveIncomes() {
	storageMutex.Lock()
	defer storageMutex.Unlock()
	data, err := json.MarshalIndent(incomes, "", "  ")
	if err != nil {
		log.Printf("Error marshaling incomes data: %v", err)
		return
	}
	_ = os.WriteFile(incomeStorageFile, data, 0644)
}

func loadGoals() {
	if _, err := os.Stat(goalsStorageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(goalsStorageFile)
	if err != nil {
		log.Printf("Error reading goals file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &goals)
}

func saveGoals() {
	storageMutex.Lock()
	defer storageMutex.Unlock()
	data, err := json.MarshalIndent(goals, "", "  ")
	if err != nil {
		log.Printf("Error marshaling goals data: %v", err)
		return
	}
	_ = os.WriteFile(goalsStorageFile, data, 0644)
}

func loadCategories() {
	if _, err := os.Stat(categoriesStorageFile); os.IsNotExist(err) {
		return
	}
	data, err := os.ReadFile(categoriesStorageFile)
	if err != nil {
		log.Printf("Error reading categories file: %v", err)
		return
	}
	_ = json.Unmarshal(data, &categories)
}

func saveCategories() {
	storageMutex.Lock()
	defer storageMutex.Unlock()
	data, err := json.MarshalIndent(categories, "", "  ")
	if err != nil {
		log.Printf("Error marshaling categories data: %v", err)
		return
	}
	_ = os.WriteFile(categoriesStorageFile, data, 0644)
}

func main() {
	// Load environment variables from .env if present
	if err := godotenv.Load(); err != nil {
		log.Println("[Env] No .env file found or error loading, checking system environment variables.")
	}

	// Initialize database connection
	_, err := database.InitDB()
	if err != nil {
		log.Printf("Warning: Database initialization failed: %v. Using local storage.\n", err)
	}

	loadExpenses()
	loadIncomes()
	loadGoals()
	loadCategories()

	router := gin.Default()

	// CORS Middleware
	frontendURL := os.Getenv("FRONTEND_URL")
	router.Use(func(ctx *gin.Context) {
		origin := ctx.Request.Header.Get("Origin")
		if origin != "" {
			isAllowed := false

			// Allow if FRONTEND_URL is not set or wildcard
			if frontendURL == "" || frontendURL == "*" {
				isAllowed = true
			} else if origin == frontendURL ||
				strings.HasSuffix(origin, ".vercel.app") ||
				strings.HasPrefix(origin, "http://localhost:") ||
				origin == "http://localhost:3000" {
				isAllowed = true
			} else {
				// Also check comma-separated FRONTEND_URL list
				for _, allowed := range strings.Split(frontendURL, ",") {
					if strings.TrimSpace(allowed) == origin {
						isAllowed = true
						break
					}
				}
			}

			if isAllowed {
				ctx.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				ctx.Writer.Header().Set("Access-Control-Allow-Origin", frontendURL)
			}
		} else {
			ctx.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		ctx.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		ctx.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey")
		ctx.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		if ctx.Request.Method == "OPTIONS" {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}
		ctx.Next()
	})

	// Public Health Check
	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"status":   "healthy",
			"database": database.DB != nil,
		})
	})

	// Protected API Routes
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())

	// --- EXPENSES API ---
	api.GET("/expenses", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")

		if database.DB != nil {
			userExpenses := []models.Expense{}
			result := database.DB.Where("user_id = ?", userID).Order("date desc").Find(&userExpenses)
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expenses"})
				return
			}
			ctx.JSON(http.StatusOK, userExpenses)
			return
		}

		// Fallback memory filtered by user
		storageMutex.RLock()
		defer storageMutex.RUnlock()
		userExpenses := []models.Expense{}
		for _, exp := range expenses {
			if exp.UserID == userID || exp.UserID == "" {
				userExpenses = append(userExpenses, exp)
			}
		}
		ctx.JSON(http.StatusOK, userExpenses)
	})

	api.POST("/expenses", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		var newExpense models.Expense
		if err := ctx.ShouldBindJSON(&newExpense); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		newExpense.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		newExpense.UserID = userID
		if newExpense.Date.IsZero() {
			newExpense.Date = time.Now()
		}

		if database.DB != nil {
			result := database.DB.Create(&newExpense)
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create expense"})
				return
			}
			ctx.JSON(http.StatusCreated, newExpense)
			return
		}

		// Fallback memory
		expenses = append([]models.Expense{newExpense}, expenses...)
		saveExpenses()
		ctx.JSON(http.StatusCreated, newExpense)
	})

	api.PUT("/expenses/:id", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		id := ctx.Param("id")

		var updatedExpense models.Expense
		if err := ctx.ShouldBindJSON(&updatedExpense); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if database.DB != nil {
			// Update only if owned by this user
			result := database.DB.Model(&models.Expense{}).
				Where("id = ? AND user_id = ?", id, userID).
				Updates(map[string]interface{}{
					"amount":         updatedExpense.Amount,
					"currency":       updatedExpense.Currency,
					"description":    updatedExpense.Description,
					"category":       updatedExpense.Category,
					"payment_method": updatedExpense.PaymentMethod,
					"date":           updatedExpense.Date,
				})

			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update expense"})
				return
			}
			if result.RowsAffected == 0 {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Expense not found or unauthorized"})
				return
			}

			updatedExpense.ID = id
			updatedExpense.UserID = userID
			ctx.JSON(http.StatusOK, updatedExpense)
			return
		}

		// Fallback memory
		found := false
		for i, expense := range expenses {
			if expense.ID == id && (expense.UserID == userID || expense.UserID == "") {
				updatedExpense.ID = id
				updatedExpense.UserID = userID
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

	api.DELETE("/expenses/:id", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		id := ctx.Param("id")

		if database.DB != nil {
			result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Expense{})
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete expense"})
				return
			}
			if result.RowsAffected == 0 {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Expense not found or unauthorized"})
				return
			}
			ctx.JSON(http.StatusNoContent, nil)
			return
		}

		// Fallback memory
		found := false
		for i, expense := range expenses {
			if expense.ID == id && (expense.UserID == userID || expense.UserID == "") {
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
	api.GET("/incomes", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")

		if database.DB != nil {
			userIncomes := []models.Income{}
			result := database.DB.Where("user_id = ?", userID).Order("date desc").Find(&userIncomes)
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incomes"})
				return
			}
			ctx.JSON(http.StatusOK, userIncomes)
			return
		}

		storageMutex.RLock()
		defer storageMutex.RUnlock()
		userIncomes := []models.Income{}
		for _, inc := range incomes {
			if inc.UserID == userID || inc.UserID == "" {
				userIncomes = append(userIncomes, inc)
			}
		}
		ctx.JSON(http.StatusOK, userIncomes)
	})

	api.POST("/incomes", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		var newIncome models.Income
		if err := ctx.ShouldBindJSON(&newIncome); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		newIncome.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		newIncome.UserID = userID
		if newIncome.Date.IsZero() {
			newIncome.Date = time.Now()
		}

		if database.DB != nil {
			result := database.DB.Create(&newIncome)
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create income"})
				return
			}
			ctx.JSON(http.StatusCreated, newIncome)
			return
		}

		incomes = append([]models.Income{newIncome}, incomes...)
		saveIncomes()
		ctx.JSON(http.StatusCreated, newIncome)
	})

	api.PUT("/incomes/:id", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		id := ctx.Param("id")

		var updatedIncome models.Income
		if err := ctx.ShouldBindJSON(&updatedIncome); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if database.DB != nil {
			result := database.DB.Model(&models.Income{}).
				Where("id = ? AND user_id = ?", id, userID).
				Updates(map[string]interface{}{
					"amount":         updatedIncome.Amount,
					"currency":       updatedIncome.Currency,
					"description":    updatedIncome.Description,
					"source":         updatedIncome.Source,
					"payment_method": updatedIncome.PaymentMethod,
					"date":           updatedIncome.Date,
				})

			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update income"})
				return
			}
			if result.RowsAffected == 0 {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Income not found or unauthorized"})
				return
			}

			updatedIncome.ID = id
			updatedIncome.UserID = userID
			ctx.JSON(http.StatusOK, updatedIncome)
			return
		}

		found := false
		for i, income := range incomes {
			if income.ID == id && (income.UserID == userID || income.UserID == "") {
				updatedIncome.ID = id
				updatedIncome.UserID = userID
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

	api.DELETE("/incomes/:id", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		id := ctx.Param("id")

		if database.DB != nil {
			result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Income{})
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete income"})
				return
			}
			if result.RowsAffected == 0 {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Income not found or unauthorized"})
				return
			}
			ctx.JSON(http.StatusNoContent, nil)
			return
		}

		found := false
		for i, income := range incomes {
			if income.ID == id && (income.UserID == userID || income.UserID == "") {
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
	api.GET("/goals", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")

		if database.DB != nil {
			userGoals := []models.Goal{}
			result := database.DB.Where("user_id = ?", userID).Order("deadline asc").Find(&userGoals)
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch goals"})
				return
			}
			ctx.JSON(http.StatusOK, userGoals)
			return
		}

		storageMutex.RLock()
		defer storageMutex.RUnlock()
		userGoals := []models.Goal{}
		for _, g := range goals {
			if g.UserID == userID || g.UserID == "" {
				userGoals = append(userGoals, g)
			}
		}
		ctx.JSON(http.StatusOK, userGoals)
	})

	api.POST("/goals", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		var newGoal models.Goal
		if err := ctx.ShouldBindJSON(&newGoal); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		newGoal.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		newGoal.UserID = userID
		if newGoal.Deadline.IsZero() {
			newGoal.Deadline = time.Now().AddDate(0, 6, 0)
		}

		if database.DB != nil {
			result := database.DB.Create(&newGoal)
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create goal"})
				return
			}
			ctx.JSON(http.StatusCreated, newGoal)
			return
		}

		goals = append([]models.Goal{newGoal}, goals...)
		saveGoals()
		ctx.JSON(http.StatusCreated, newGoal)
	})

	api.PUT("/goals/:id", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		id := ctx.Param("id")

		var updatedGoal models.Goal
		if err := ctx.ShouldBindJSON(&updatedGoal); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if database.DB != nil {
			result := database.DB.Model(&models.Goal{}).
				Where("id = ? AND user_id = ?", id, userID).
				Updates(map[string]interface{}{
					"name":           updatedGoal.Name,
					"target_amount":  updatedGoal.TargetAmount,
					"current_amount": updatedGoal.CurrentAmount,
					"deadline":       updatedGoal.Deadline,
					"category":       updatedGoal.Category,
				})

			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update goal"})
				return
			}
			if result.RowsAffected == 0 {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Goal not found or unauthorized"})
				return
			}

			updatedGoal.ID = id
			updatedGoal.UserID = userID
			ctx.JSON(http.StatusOK, updatedGoal)
			return
		}

		found := false
		for i, goal := range goals {
			if goal.ID == id && (goal.UserID == userID || goal.UserID == "") {
				updatedGoal.ID = id
				updatedGoal.UserID = userID
				if updatedGoal.Deadline.IsZero() {
					updatedGoal.Deadline = goal.Deadline
				}
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

	api.DELETE("/goals/:id", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		id := ctx.Param("id")

		if database.DB != nil {
			result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Goal{})
			if result.Error != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete goal"})
				return
			}
			if result.RowsAffected == 0 {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Goal not found or unauthorized"})
				return
			}
			ctx.JSON(http.StatusNoContent, nil)
			return
		}

		found := false
		for i, goal := range goals {
			if goal.ID == id && (goal.UserID == userID || goal.UserID == "") {
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

	// --- CATEGORIES API ---
	// GET /api/categories?type=expense|income
	api.GET("/categories", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		catType := strings.ToLower(strings.TrimSpace(ctx.Query("type")))

		var resultList []models.CategoryResponse

		// Add default system categories matching filter
		if catType == "" || catType == "expense" {
			resultList = append(resultList, models.DefaultExpenseCategories...)
		}
		if catType == "" || catType == "income" {
			resultList = append(resultList, models.DefaultIncomeSources...)
		}

		if database.DB != nil {
			var userCategories []models.Category
			query := database.DB.Where("user_id = ?", userID)
			if catType != "" {
				query = query.Where("type = ?", catType)
			}
			if err := query.Order("created_at asc").Find(&userCategories).Error; err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No fue posible cargar las categorías"})
				return
			}

			for _, c := range userCategories {
				resultList = append(resultList, models.CategoryResponse{
					ID:        c.ID,
					UserID:    c.UserID,
					Name:      c.Name,
					Type:      c.Type,
					Color:     c.Color,
					Icon:      c.Icon,
					IsDefault: false,
					CreatedAt: c.CreatedAt,
				})
			}
			ctx.JSON(http.StatusOK, resultList)
			return
		}

		// Fallback in-memory
		storageMutex.RLock()
		defer storageMutex.RUnlock()
		for _, c := range categories {
			if (c.UserID == userID || c.UserID == "") && (catType == "" || c.Type == catType) {
				resultList = append(resultList, models.CategoryResponse{
					ID:        c.ID,
					UserID:    c.UserID,
					Name:      c.Name,
					Type:      c.Type,
					Color:     c.Color,
					Icon:      c.Icon,
					IsDefault: false,
					CreatedAt: c.CreatedAt,
				})
			}
		}
		ctx.JSON(http.StatusOK, resultList)
	})

	// POST /api/categories
	api.POST("/categories", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		var req struct {
			Name  string `json:"name"`
			Type  string `json:"type"`
			Color string `json:"color"`
			Icon  string `json:"icon"`
		}

		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Información de categoría inválida"})
			return
		}

		name := strings.TrimSpace(req.Name)
		if name == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "El nombre de la categoría es requerido"})
			return
		}
		if len(name) > 50 {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "El nombre de la categoría no debe exceder 50 caracteres"})
			return
		}

		catType := strings.ToLower(strings.TrimSpace(req.Type))
		if catType != "expense" && catType != "income" {
			catType = "expense"
		}

		color := strings.TrimSpace(req.Color)
		if color == "" {
			color = "blue"
		}

		icon := strings.TrimSpace(req.Icon)
		if icon == "" {
			icon = "tag"
		}

		// Check collision with default system categories
		if catType == "expense" {
			for _, def := range models.DefaultExpenseCategories {
				if strings.EqualFold(def.Name, name) {
					ctx.JSON(http.StatusBadRequest, gin.H{"error": "Ya existe una categoría del sistema con ese nombre"})
					return
				}
			}
		} else {
			for _, def := range models.DefaultIncomeSources {
				if strings.EqualFold(def.Name, name) {
					ctx.JSON(http.StatusBadRequest, gin.H{"error": "Ya existe una categoría del sistema con ese nombre"})
					return
				}
			}
		}

		newCat := models.Category{
			ID:        fmt.Sprintf("cat-%d", time.Now().UnixNano()),
			UserID:    userID,
			Name:      name,
			Type:      catType,
			Color:     color,
			Icon:      icon,
			CreatedAt: time.Now(),
		}

		if database.DB != nil {
			var existing models.Category
			if err := database.DB.Where("user_id = ? AND LOWER(name) = ? AND type = ?", userID, strings.ToLower(name), catType).First(&existing).Error; err == nil {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "Ya tienes una categoría creada con este nombre"})
				return
			}

			if err := database.DB.Create(&newCat).Error; err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No fue posible guardar la categoría"})
				return
			}

			ctx.JSON(http.StatusCreated, models.CategoryResponse{
				ID:        newCat.ID,
				UserID:    newCat.UserID,
				Name:      newCat.Name,
				Type:      newCat.Type,
				Color:     newCat.Color,
				Icon:      newCat.Icon,
				IsDefault: false,
				CreatedAt: newCat.CreatedAt,
			})
			return
		}

		// Fallback in-memory
		storageMutex.Lock()
		for _, c := range categories {
			if c.UserID == userID && strings.EqualFold(c.Name, name) && c.Type == catType {
				storageMutex.Unlock()
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "Ya tienes una categoría creada con este nombre"})
				return
			}
		}
		categories = append(categories, newCat)
		storageMutex.Unlock()
		saveCategories()

		ctx.JSON(http.StatusCreated, models.CategoryResponse{
			ID:        newCat.ID,
			UserID:    newCat.UserID,
			Name:      newCat.Name,
			Type:      newCat.Type,
			Color:     newCat.Color,
			Icon:      newCat.Icon,
			IsDefault: false,
			CreatedAt: newCat.CreatedAt,
		})
	})

	// DELETE /api/categories/:id?reassignTo=...
	api.DELETE("/categories/:id", func(ctx *gin.Context) {
		userID := ctx.GetString("userID")
		id := ctx.Param("id")
		reassignTo := strings.TrimSpace(ctx.Query("reassignTo"))

		if strings.HasPrefix(id, "default-") {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Las categorías del sistema no se pueden eliminar"})
			return
		}

		if database.DB != nil {
			var cat models.Category
			if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&cat).Error; err != nil {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Categoría no encontrada o no autorizada"})
				return
			}

			// Validate if expenses or incomes are using this category
			var count int64
			if cat.Type == "expense" {
				database.DB.Model(&models.Expense{}).Where("user_id = ? AND category = ?", userID, cat.Name).Count(&count)
			} else {
				database.DB.Model(&models.Income{}).Where("user_id = ? AND source = ?", userID, cat.Name).Count(&count)
			}

			if count > 0 {
				if reassignTo == "" {
					ctx.JSON(http.StatusConflict, gin.H{
						"error":         fmt.Sprintf("Esta categoría está asociada a %d transacción(es). Puedes reasignarlas antes de eliminarla.", count),
						"in_use":        true,
						"count":         count,
						"category_name": cat.Name,
						"category_type": cat.Type,
					})
					return
				}

				// Reassign matching transactions
				if cat.Type == "expense" {
					if err := database.DB.Model(&models.Expense{}).Where("user_id = ? AND category = ?", userID, cat.Name).Update("category", reassignTo).Error; err != nil {
						ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No fue posible reasignar los gastos"})
						return
					}
				} else {
					if err := database.DB.Model(&models.Income{}).Where("user_id = ? AND source = ?", userID, cat.Name).Update("source", reassignTo).Error; err != nil {
						ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No fue posible reasignar los ingresos"})
						return
					}
				}
			}

			if err := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Category{}).Error; err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "No fue posible eliminar la categoría"})
				return
			}

			ctx.JSON(http.StatusOK, gin.H{
				"message":         "Categoría eliminada exitosamente",
				"reassigned":      count > 0,
				"reassigned_to":   reassignTo,
				"reassigned_count": count,
			})
			return
		}

		// Fallback in-memory
		storageMutex.Lock()
		defer storageMutex.Unlock()

		catIdx := -1
		var cat models.Category
		for i, c := range categories {
			if c.ID == id && (c.UserID == userID || c.UserID == "") {
				catIdx = i
				cat = c
				break
			}
		}

		if catIdx == -1 {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Categoría no encontrada"})
			return
		}

		var count int64
		if cat.Type == "expense" {
			for _, exp := range expenses {
				if exp.UserID == userID && exp.Category == cat.Name {
					count++
				}
			}
		} else {
			for _, inc := range incomes {
				if inc.UserID == userID && inc.Source == cat.Name {
					count++
				}
			}
		}

		if count > 0 {
			if reassignTo == "" {
				ctx.JSON(http.StatusConflict, gin.H{
					"error":         fmt.Sprintf("Esta categoría está asociada a %d transacción(es). Puedes reasignarlas antes de continuar.", count),
					"in_use":        true,
					"count":         count,
					"category_name": cat.Name,
					"category_type": cat.Type,
				})
				return
			}

			if cat.Type == "expense" {
				for i := range expenses {
					if expenses[i].UserID == userID && expenses[i].Category == cat.Name {
						expenses[i].Category = reassignTo
					}
				}
				saveExpenses()
			} else {
				for i := range incomes {
					if incomes[i].UserID == userID && incomes[i].Source == cat.Name {
						incomes[i].Source = reassignTo
					}
				}
				saveIncomes()
			}
		}

		categories = append(categories[:catIdx], categories[catIdx+1:]...)
		saveCategories()

		ctx.JSON(http.StatusOK, gin.H{
			"message":         "Categoría eliminada exitosamente",
			"reassigned":      count > 0,
			"reassigned_to":   reassignTo,
			"reassigned_count": count,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}
