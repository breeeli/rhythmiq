package handler

import (
	"net/http"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	svc *service.TaskService
}

func NewTaskHandler(svc *service.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

func (h *TaskHandler) Create(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}

	var req struct {
		GoalID           *uint               `json:"goal_id"`
		Title            string              `json:"title" binding:"required"`
		Description      string              `json:"description"`
		ExpectedOutput   string              `json:"expected_output"`
		Status           domain.TaskStatus   `json:"status"`
		Priority         domain.TaskPriority `json:"priority"`
		EstimatedMinutes int                 `json:"estimated_minutes"`
		DueDate          *time.Time          `json:"due_date"`
		PreferMorning    bool                `json:"prefer_morning"`
		NeedsFocus       bool                `json:"needs_focus"`
		Sequence         int                 `json:"sequence"`
		Tags             string              `json:"tags"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	task, err := h.svc.Create(c.Request.Context(), userID, service.CreateTaskRequest{
		GoalID:           req.GoalID,
		Title:            req.Title,
		Description:      req.Description,
		ExpectedOutput:   req.ExpectedOutput,
		Status:           req.Status,
		Priority:         req.Priority,
		EstimatedMinutes: req.EstimatedMinutes,
		DueDate:          req.DueDate,
		PreferMorning:    req.PreferMorning,
		NeedsFocus:       req.NeedsFocus,
		Sequence:         req.Sequence,
		Tags:             req.Tags,
	})
	if err != nil {
		if service.IsValidationError(err) {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, err.Error())
		return
	}
	response.Created(c, task)
}

func (h *TaskHandler) Get(c *gin.Context) {
	taskID, err := parseUint(c.Param("taskID"))
	if err != nil {
		response.BadRequest(c, "invalid task id")
		return
	}
	task, err := h.svc.GetByID(c.Request.Context(), taskID)
	if err != nil {
		response.NotFound(c, "task not found")
		return
	}
	response.OK(c, task)
}

func (h *TaskHandler) List(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	tasks, err := h.svc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, tasks)
}

func (h *TaskHandler) Update(c *gin.Context) {
	taskID, err := parseUint(c.Param("taskID"))
	if err != nil {
		response.BadRequest(c, "invalid task id")
		return
	}

	var req struct {
		Title            string              `json:"title"`
		Description      string              `json:"description"`
		ExpectedOutput   string              `json:"expected_output"`
		Status           domain.TaskStatus   `json:"status"`
		Priority         domain.TaskPriority `json:"priority"`
		EstimatedMinutes int                 `json:"estimated_minutes"`
		ActualMinutes    int                 `json:"actual_minutes"`
		DueDate          *time.Time          `json:"due_date"`
		Sequence         *int                `json:"sequence"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	task, err := h.svc.Update(c.Request.Context(), taskID, service.UpdateTaskRequest{
		Title:            req.Title,
		Description:      req.Description,
		ExpectedOutput:   req.ExpectedOutput,
		Status:           req.Status,
		Priority:         req.Priority,
		EstimatedMinutes: req.EstimatedMinutes,
		ActualMinutes:    req.ActualMinutes,
		DueDate:          req.DueDate,
		Sequence:         req.Sequence,
	})
	if err != nil {
		if service.IsValidationError(err) {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, task)
}

func (h *TaskHandler) Delete(c *gin.Context) {
	taskID, err := parseUint(c.Param("taskID"))
	if err != nil {
		response.BadRequest(c, "invalid task id")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), taskID); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}
