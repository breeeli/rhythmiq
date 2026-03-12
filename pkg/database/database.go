package database

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/breeeli/rhythmiq/internal/config"
	"github.com/breeeli/rhythmiq/internal/domain"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// New creates and configures a GORM DB connection based on config.
// Currently only SQLite is supported; add cases here when migrating.
func New(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	switch cfg.Driver {
	case "sqlite", "":
		return newSQLite(cfg.DSN)
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", cfg.Driver)
	}
}

func newSQLite(dsn string) (*gorm.DB, error) {
	if err := os.MkdirAll(filepath.Dir(dsn), 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(1) // SQLite only supports one writer at a time

	return db, nil
}

// Migrate runs auto-migration for all domain models.
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&domain.User{},
		&domain.Goal{},
		&domain.Task{},
		&domain.DailyPlan{},
		&domain.TimeBlock{},
	)
}
