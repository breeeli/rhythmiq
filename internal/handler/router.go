package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/breeeli/rhythmiq/internal/middleware"
	"go.uber.org/zap"
)

type Router struct {
	engine  *gin.Engine
	user    *UserHandler
	goal    *GoalHandler
	task    *TaskHandler
	plan    *PlanHandler
}

func NewRouter(
	log *zap.Logger,
	user *UserHandler,
	goal *GoalHandler,
	task *TaskHandler,
	plan *PlanHandler,
) *Router {
	r := &Router{
		engine: gin.New(),
		user:   user,
		goal:   goal,
		task:   task,
		plan:   plan,
	}
	r.engine.Use(middleware.Recovery(log))
	r.engine.Use(middleware.Logger(log))
	r.register()
	return r
}

func (r *Router) Engine() *gin.Engine {
	return r.engine
}

func (r *Router) register() {
	r.engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	v1 := r.engine.Group("/api/v1")

	// Users — flat resource, no nested sub-resources on this group to avoid param conflicts
	v1.POST("/users", r.user.Create)
	v1.GET("/users/:id", r.user.Get)
	v1.PUT("/users/:id", r.user.Update)
	v1.DELETE("/users/:id", r.user.Delete)

	// Goals — nested under /u/:userID to avoid wildcard conflict with /users/:id
	v1.GET("/u/:userID/goals", r.goal.List)
	v1.POST("/u/:userID/goals", r.goal.Create)
	v1.GET("/goals/:id", r.goal.Get)
	v1.PUT("/goals/:id", r.goal.Update)
	v1.DELETE("/goals/:id", r.goal.Delete)

	// Tasks — nested under /u/:userID
	v1.GET("/u/:userID/tasks", r.task.List)
	v1.POST("/u/:userID/tasks", r.task.Create)
	v1.GET("/tasks/:id", r.task.Get)
	v1.PUT("/tasks/:id", r.task.Update)
	v1.DELETE("/tasks/:id", r.task.Delete)

	// Plans — nested under /u/:userID
	v1.POST("/u/:userID/plans/generate", r.plan.Generate)
	v1.GET("/u/:userID/plans/today", r.plan.Today)
	v1.PUT("/plans/:id/confirm", r.plan.Confirm)
}
