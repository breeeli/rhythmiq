package handler

import (
	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
	"github.com/gin-gonic/gin"
)

type SubtaskHandler struct {
	svc *service.SubtaskService
}

func NewSubtaskHandler(svc *service.SubtaskService) *SubtaskHandler {
	return &SubtaskHandler{svc: svc}
}

func (h *SubtaskHandler) Create(c *gin.Context) {
	taskID, err := parseUint(c.Param("taskID"))
	if err != nil {
		response.BadRequest(c, "invalid task id")
		return
	}

	var req struct {
		Title              string              `json:"title" binding:"required"`
		Description        string              `json:"description"`
		Priority           domain.TaskPriority `json:"priority"`
		EstimatedMinutes   int                 `json:"estimated_minutes"`
		PreferWindow       string              `json:"prefer_window"`
		DependsOnSubtaskID *uint               `json:"depends_on_subtask_id"`
		LLMGenerated       bool                `json:"llm_generated"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	subtask, err := h.svc.Create(c.Request.Context(), service.CreateSubtaskRequest{
		TaskID:             taskID,
		Title:              req.Title,
		Description:        req.Description,
		Priority:           req.Priority,
		EstimatedMinutes:   req.EstimatedMinutes,
		PreferWindow:       req.PreferWindow,
		DependsOnSubtaskID: req.DependsOnSubtaskID,
		LLMGenerated:       req.LLMGenerated,
	})
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Created(c, subtask)
}

func (h *SubtaskHandler) List(c *gin.Context) {
	taskID, err := parseUint(c.Param("taskID"))
	if err != nil {
		response.BadRequest(c, "invalid task id")
		return
	}
	subtasks, err := h.svc.ListByTask(c.Request.Context(), taskID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, subtasks)
}

func (h *SubtaskHandler) Update(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req struct {
		Title            string                 `json:"title"`
		Description      string                 `json:"description"`
		Status           domain.SubtaskStatus   `json:"status"`
		Priority         domain.TaskPriority    `json:"priority"`
		EstimatedMinutes int                    `json:"estimated_minutes"`
		ActualMinutes    int                    `json:"actual_minutes"`
		PreferWindow     string                 `json:"prefer_window"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	subtask, err := h.svc.Update(c.Request.Context(), id, service.UpdateSubtaskRequest{
		Title:            req.Title,
		Description:      req.Description,
		Status:           req.Status,
		Priority:         req.Priority,
		EstimatedMinutes: req.EstimatedMinutes,
		ActualMinutes:    req.ActualMinutes,
		PreferWindow:     req.PreferWindow,
	})
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, subtask)
}
