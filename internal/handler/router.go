package handler

import (
	"net/http"

	"github.com/breeeli/rhythmiq/internal/middleware"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Router struct {
	engine      *gin.Engine
	user        *UserHandler
	goal        *GoalHandler
	task        *TaskHandler
	subtask     *SubtaskHandler
	plan        *PlanHandler
	constraints *PlanningConstraintHandler
}

func NewRouter(
	log *zap.Logger,
	user *UserHandler,
	goal *GoalHandler,
	task *TaskHandler,
	subtask *SubtaskHandler,
	plan *PlanHandler,
	constraints *PlanningConstraintHandler,
) *Router {
	r := &Router{
		engine:      gin.New(),
		user:        user,
		goal:        goal,
		task:        task,
		subtask:     subtask,
		plan:        plan,
		constraints: constraints,
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
	v1.GET("/tasks/:taskID", r.task.Get)
	v1.PUT("/tasks/:taskID", r.task.Update)
	v1.DELETE("/tasks/:taskID", r.task.Delete)
	v1.GET("/tasks/:taskID/subtasks", r.subtask.List)
	v1.POST("/tasks/:taskID/subtasks", r.subtask.Create)
	v1.PUT("/subtasks/:id", r.subtask.Update)

	// Plans — nested under /u/:userID
	v1.POST("/u/:userID/plans/generate", r.plan.Generate)
	v1.GET("/u/:userID/plans/target", r.plan.ByDate)
	v1.PUT("/plans/:id/confirm", r.plan.Confirm)

	// Planning constraints
	v1.GET("/u/:userID/planning-constraints", r.constraints.List)
	v1.POST("/u/:userID/schedule-rules", r.constraints.CreateScheduleRule)
	v1.PUT("/schedule-rules/:id", r.constraints.UpdateScheduleRule)
	v1.DELETE("/schedule-rules/:id", r.constraints.DeleteScheduleRule)
	v1.POST("/u/:userID/habit-rules", r.constraints.CreateHabitRule)
	v1.PUT("/habit-rules/:id", r.constraints.UpdateHabitRule)
	v1.DELETE("/habit-rules/:id", r.constraints.DeleteHabitRule)
}
