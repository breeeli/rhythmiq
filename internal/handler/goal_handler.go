package handler

import (
	"net/http"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
	"github.com/gin-gonic/gin"
)

type GoalHandler struct {
	svc *service.GoalService
}

func NewGoalHandler(svc *service.GoalService) *GoalHandler {
	return &GoalHandler{svc: svc}
}

func (h *GoalHandler) Create(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}

	var req struct {
		Title       string              `json:"title" binding:"required"`
		Description string              `json:"description"`
		Type        domain.GoalType     `json:"type"`
		Priority    domain.GoalPriority `json:"priority"`
		Deadline    *time.Time          `json:"deadline"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	goal, err := h.svc.Create(c.Request.Context(), userID, service.CreateGoalRequest{
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		Priority:    req.Priority,
		Deadline:    req.Deadline,
	})
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Created(c, goal)
}

func (h *GoalHandler) Generate(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}

	var req struct {
		Prompt      string `json:"prompt" binding:"required"`
		ContextText string `json:"context_text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	goal, err := h.svc.Generate(c.Request.Context(), userID, service.GenerateGoalRequest{
		Prompt:      req.Prompt,
		ContextText: req.ContextText,
	})
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.Created(c, goal)
}

func (h *GoalHandler) Get(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	goal, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "goal not found")
		return
	}
	response.OK(c, goal)
}

func (h *GoalHandler) List(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	goals, err := h.svc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, goals)
}

func (h *GoalHandler) Update(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req struct {
		Title       string              `json:"title"`
		Description string              `json:"description"`
		Status      domain.GoalStatus   `json:"status"`
		Priority    domain.GoalPriority `json:"priority"`
		Deadline    *time.Time          `json:"deadline"`
		Progress    int                 `json:"progress"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	goal, err := h.svc.Update(c.Request.Context(), id, service.UpdateGoalRequest{
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		Deadline:    req.Deadline,
		Progress:    req.Progress,
	})
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, goal)
}

func (h *GoalHandler) Delete(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}
