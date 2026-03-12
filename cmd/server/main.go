package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/breeeli/rhythmiq/internal/ai/mock"
	"github.com/breeeli/rhythmiq/internal/config"
	"github.com/breeeli/rhythmiq/internal/handler"
	"github.com/breeeli/rhythmiq/internal/repository/sqlite"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/database"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	cfg, err := config.Load("")
	if err != nil {
		fmt.Fprintf(os.Stderr, "load config: %v\n", err)
		os.Exit(1)
	}

	log, err := buildLogger(cfg.Log)
	if err != nil {
		fmt.Fprintf(os.Stderr, "build logger: %v\n", err)
		os.Exit(1)
	}
	defer log.Sync() //nolint:errcheck

	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatal("connect database", zap.Error(err))
	}
	if err := database.Migrate(db); err != nil {
		log.Fatal("migrate database", zap.Error(err))
	}
	log.Info("database ready", zap.String("driver", cfg.Database.Driver), zap.String("dsn", cfg.Database.DSN))

	// Wire repositories
	userRepo := sqlite.NewUserRepo(db)
	goalRepo := sqlite.NewGoalRepo(db)
	taskRepo := sqlite.NewTaskRepo(db)
	planRepo := sqlite.NewPlanRepo(db)

	// Wire AI planner (swap mock.New() with real implementation when ready)
	planner := mock.New()

	// Wire services
	userSvc := service.NewUserService(userRepo)
	goalSvc := service.NewGoalService(goalRepo)
	taskSvc := service.NewTaskService(taskRepo)
	plannerSvc := service.NewPlannerService(planRepo, taskRepo, userRepo, planner)

	// Wire handlers
	userHandler := handler.NewUserHandler(userSvc)
	goalHandler := handler.NewGoalHandler(goalSvc)
	taskHandler := handler.NewTaskHandler(taskSvc)
	planHandler := handler.NewPlanHandler(plannerSvc)

	gin.SetMode(cfg.Server.Mode)
	router := handler.NewRouter(log, userHandler, goalHandler, taskHandler, planHandler)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router.Engine(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info("server starting", zap.String("addr", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal("server error", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("graceful shutdown failed", zap.Error(err))
	}
	log.Info("server stopped")
}

func buildLogger(cfg config.LogConfig) (*zap.Logger, error) {
	level := zap.InfoLevel
	if err := level.UnmarshalText([]byte(cfg.Level)); err != nil {
		level = zap.InfoLevel
	}

	var zapCfg zap.Config
	if cfg.Format == "console" {
		zapCfg = zap.NewDevelopmentConfig()
	} else {
		zapCfg = zap.NewProductionConfig()
	}
	zapCfg.Level = zap.NewAtomicLevelAt(level)
	zapCfg.EncoderConfig.TimeKey = "time"
	zapCfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	return zapCfg.Build()
}
