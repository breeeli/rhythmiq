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

	"github.com/breeeli/rhythmiq/internal/ai/mock"
	"github.com/breeeli/rhythmiq/internal/config"
	"github.com/breeeli/rhythmiq/internal/handler"
	"github.com/breeeli/rhythmiq/internal/repository/sqlite"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/database"
	"github.com/gin-gonic/gin"
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
	subtaskRepo := sqlite.NewSubtaskRepo(db)
	planRepo := sqlite.NewPlanRepo(db)
	scheduleRuleRepo := sqlite.NewScheduleRuleRepo(db)
	habitRuleRepo := sqlite.NewHabitRuleRepo(db)
	timeBlockRepo := sqlite.NewTimeBlockRuleRepo(db)

	// Wire AI planner (swap mock.New() with real implementation when ready)
	planner := mock.New()
	goalGenerator := mock.NewGoalGenerator()
	taskDecomposer := mock.NewTaskDecomposer()

	// Wire services
	userSvc := service.NewUserService(userRepo)
	goalSvc := service.NewGoalService(goalRepo, taskRepo, goalGenerator)
	taskSvc := service.NewTaskService(taskRepo, subtaskRepo, taskDecomposer)
	subtaskSvc := service.NewSubtaskService(subtaskRepo, taskRepo)
	constraintSvc := service.NewPlanningConstraintService(scheduleRuleRepo, habitRuleRepo)
	timeBlockSvc := service.NewTimeBlockService(timeBlockRepo)
	plannerSvc := service.NewPlannerService(planRepo, taskRepo, userRepo, scheduleRuleRepo, habitRuleRepo, planner)

	seedTimeBlocks(timeBlockSvc)

	// Wire handlers
	userHandler := handler.NewUserHandler(userSvc)
	goalHandler := handler.NewGoalHandler(goalSvc)
	taskHandler := handler.NewTaskHandler(taskSvc)
	subtaskHandler := handler.NewSubtaskHandler(subtaskSvc)
	planHandler := handler.NewPlanHandler(plannerSvc)
	constraintHandler := handler.NewPlanningConstraintHandler(constraintSvc)
	timeBlockHandler := handler.NewTimeBlockHandler(timeBlockSvc)

	gin.SetMode(cfg.Server.Mode)
	router := handler.NewRouter(log, userHandler, goalHandler, taskHandler, subtaskHandler, planHandler, constraintHandler, timeBlockHandler)

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

func seedTimeBlocks(timeBlockSvc *service.TimeBlockService) {
	ctx := context.Background()
	existing, err := timeBlockSvc.List(ctx, 1)
	if err != nil || len(existing) > 0 {
		return
	}

	seeds := []service.UpsertTimeBlockRequest{
		{Title: "晨间例行", StartTime: "08:40", EndTime: "09:20", RecurrenceType: "DAILY"},
		{Title: "周一团队会", StartTime: "15:00", EndTime: "16:00", RecurrenceType: "WEEKLY", DaysOfWeek: []string{"mon"}},
		{Title: "朋友来访", StartTime: "18:00", EndTime: "20:00", RecurrenceType: "NONE", Date: time.Now().UTC().AddDate(0, 0, 2).Format("2006-01-02")},
		{Title: "晚间复盘", StartTime: "21:00", EndTime: "21:30", RecurrenceType: "DAILY"},
		{Title: "周四同步", StartTime: "10:00", EndTime: "10:30", RecurrenceType: "WEEKLY", DaysOfWeek: []string{"thu"}},
	}
	for _, seed := range seeds {
		_, _ = timeBlockSvc.Create(ctx, 1, seed)
	}
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
