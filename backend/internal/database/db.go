package database

import (
	"log"
	"os"

	"github.com/TonyBrTs/fintrack-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes connection to PostgreSQL (Supabase).
func InitDB() (*gorm.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Println("[Database] DATABASE_URL not set. Running in offline/memory mode.")
		return nil, nil
	}

	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	}

	db, err := gorm.Open(postgres.Open(databaseURL), config)
	if err != nil {
		log.Printf("[Database] Failed to connect to PostgreSQL: %v\n", err)
		return nil, err
	}

	// AutoMigrate ensures columns match models
	err = db.AutoMigrate(&models.Expense{}, &models.Income{}, &models.Goal{})
	if err != nil {
		log.Printf("[Database] AutoMigrate warning: %v\n", err)
	}

	DB = db
	log.Println("[Database] Successfully connected to Supabase PostgreSQL!")
	return db, nil
}
