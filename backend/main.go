package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/TonyBrTs/fintrack-backend/internal/database"
	"github.com/TonyBrTs/fintrack-backend/internal/handlers"
	"github.com/TonyBrTs/fintrack-backend/internal/middleware"
	"github.com/TonyBrTs/fintrack-backend/internal/repository"
	"github.com/TonyBrTs/fintrack-backend/internal/repository/gorm_repo"
	"github.com/TonyBrTs/fintrack-backend/internal/repository/memory_repo"
	"github.com/TonyBrTs/fintrack-backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

const (
	expensesFile          = "expenses.json"
	incomesFile           = "incomes.json"
	goalsFile             = "goals.json"
	categoriesFile        = "categories.json"
	recurringExpensesFile = "recurring_expenses.json"
)

func main() {
	// 1. Load environment configuration
	if err := godotenv.Load(); err != nil {
		log.Println("[Env] No .env file found or error loading, checking system environment variables.")
	}

	// 2. Initialize Database Connection
	db, err := database.InitDB()
	if err != nil {
		log.Printf("Warning: Database initialization failed: %v. Using local storage.\n", err)
	}

	// 3. Instantiate Repositories (Liskov Substitution Principle: GORM or Memory fallback)
	var (
		expenseRepo   repository.ExpenseRepository
		incomeRepo    repository.IncomeRepository
		goalRepo      repository.GoalRepository
		categoryRepo  repository.CategoryRepository
		recurringRepo repository.RecurringExpenseRepository
	)

	if db != nil {
		log.Println("[Storage] Initializing GORM PostgreSQL repositories...")
		expenseRepo = gorm_repo.NewGormExpenseRepository(db)
		incomeRepo = gorm_repo.NewGormIncomeRepository(db)
		goalRepo = gorm_repo.NewGormGoalRepository(db)
		categoryRepo = gorm_repo.NewGormCategoryRepository(db)
		recurringRepo = gorm_repo.NewGormRecurringExpenseRepository(db)
	} else {
		log.Println("[Storage] Initializing Memory & JSON fallback repositories...")
		expenseRepo = memory_repo.NewMemoryExpenseRepository(expensesFile)
		incomeRepo = memory_repo.NewMemoryIncomeRepository(incomesFile)
		goalRepo = memory_repo.NewMemoryGoalRepository(goalsFile)
		categoryRepo = memory_repo.NewMemoryCategoryRepository(categoriesFile)
		recurringRepo = memory_repo.NewMemoryRecurringExpenseRepository(recurringExpensesFile)
	}

	// 4. Instantiate Services (Dependency Inversion: Injecting Repositories)
	expenseService := services.NewExpenseService(expenseRepo)
	incomeService := services.NewIncomeService(incomeRepo)
	goalService := services.NewGoalService(goalRepo)
	categoryService := services.NewCategoryService(categoryRepo, expenseRepo, incomeRepo)
	recurringService := services.NewRecurringExpenseService(recurringRepo, expenseRepo)

	// 5. Instantiate Handlers (Single Responsibility: Pure HTTP mapping)
	expenseHandler := handlers.NewExpenseHandler(expenseService)
	incomeHandler := handlers.NewIncomeHandler(incomeService)
	goalHandler := handlers.NewGoalHandler(goalService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	recurringHandler := handlers.NewRecurringExpenseHandler(recurringService)

	// Background scheduler for due recurring expenses (checks periodically)
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			count, err := recurringService.ProcessAllDueExpenses(context.Background())
			if err != nil {
				log.Printf("[Scheduler] Error processing recurring expenses: %v\n", err)
			} else if count > 0 {
				log.Printf("[Scheduler] Automatically processed %d due recurring expenses.\n", count)
			}
		}
	}()

	// 6. Setup Gin Router & Middlewares
	router := gin.Default()
	router.Use(middleware.CORSMiddleware())

	// Public Health Endpoint
	router.GET("/health", handlers.HealthCheck)

	// Protected API Routes (Supabase Auth Middleware)
	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// Expenses API
		api.GET("/expenses", expenseHandler.GetExpenses)
		api.POST("/expenses", expenseHandler.CreateExpense)
		api.PUT("/expenses/:id", expenseHandler.UpdateExpense)
		api.DELETE("/expenses/:id", expenseHandler.DeleteExpense)

		// Recurring / Fixed Expenses API
		api.GET("/recurring-expenses", recurringHandler.GetRecurringExpenses)
		api.POST("/recurring-expenses", recurringHandler.CreateRecurringExpense)
		api.PUT("/recurring-expenses/:id", recurringHandler.UpdateRecurringExpense)
		api.DELETE("/recurring-expenses/:id", recurringHandler.DeleteRecurringExpense)
		api.POST("/recurring-expenses/sync", recurringHandler.SyncDueExpenses)
		api.POST("/recurring-expenses/:id/execute-now", recurringHandler.ExecuteNow)

		// Incomes API
		api.GET("/incomes", incomeHandler.GetIncomes)
		api.POST("/incomes", incomeHandler.CreateIncome)
		api.PUT("/incomes/:id", incomeHandler.UpdateIncome)
		api.DELETE("/incomes/:id", incomeHandler.DeleteIncome)

		// Goals API
		api.GET("/goals", goalHandler.GetGoals)
		api.POST("/goals", goalHandler.CreateGoal)
		api.PUT("/goals/:id", goalHandler.UpdateGoal)
		api.DELETE("/goals/:id", goalHandler.DeleteGoal)

		// Categories API
		api.GET("/categories", categoryHandler.GetCategories)
		api.POST("/categories", categoryHandler.CreateCategory)
		api.DELETE("/categories/:id", categoryHandler.DeleteCategory)
	}

	// 7. Start HTTP Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("FinTrack API server starting on port %s...\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}

