package handler

import (
	"net/http"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
	"github.com/gin-gonic/gin"
)

type PlanningConstraintHandler struct {
	svc *service.PlanningConstraintService
}

func NewPlanningConstraintHandler(svc *service.PlanningConstraintService) *PlanningConstraintHandler {
	return &PlanningConstraintHandler{svc: svc}
}

func (h *PlanningConstraintHandler) List(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	result, err := h.svc.List(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, result)
}

func (h *PlanningConstraintHandler) CreateScheduleRule(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	var req struct {
		Title     string                  `json:"title" binding:"required"`
		Kind      domain.ScheduleRuleKind `json:"kind"`
		StartTime string                  `json:"start_time" binding:"required"`
		EndTime   string                  `json:"end_time" binding:"required"`
		Days      []string                `json:"days"`
		Locked    *bool                   `json:"locked"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	locked := true
	if req.Locked != nil {
		locked = *req.Locked
	}
	rule, err := h.svc.CreateScheduleRule(c.Request.Context(), userID, service.UpsertScheduleRuleRequest{
		Title:     req.Title,
		Kind:      req.Kind,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Days:      req.Days,
		Locked:    locked,
	})
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, rule)
}

func (h *PlanningConstraintHandler) UpdateScheduleRule(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid schedule rule id")
		return
	}
	var req struct {
		Title     string                  `json:"title" binding:"required"`
		Kind      domain.ScheduleRuleKind `json:"kind"`
		StartTime string                  `json:"start_time" binding:"required"`
		EndTime   string                  `json:"end_time" binding:"required"`
		Days      []string                `json:"days"`
		Locked    *bool                   `json:"locked"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	locked := true
	if req.Locked != nil {
		locked = *req.Locked
	}
	rule, err := h.svc.UpdateScheduleRule(c.Request.Context(), id, service.UpsertScheduleRuleRequest{
		Title:     req.Title,
		Kind:      req.Kind,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Days:      req.Days,
		Locked:    locked,
	})
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, rule)
}

func (h *PlanningConstraintHandler) DeleteScheduleRule(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid schedule rule id")
		return
	}
	if err := h.svc.DeleteScheduleRule(c.Request.Context(), id); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *PlanningConstraintHandler) CreateHabitRule(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	var req struct {
		Title           string                     `json:"title" binding:"required"`
		DurationMinutes int                        `json:"duration_minutes" binding:"required"`
		Days            []string                   `json:"days"`
		PreferredTime   domain.HabitTimePreference `json:"preferred_time"`
		PreferredStart  string                     `json:"preferred_start"`
		Required        *bool                      `json:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	required := true
	if req.Required != nil {
		required = *req.Required
	}
	rule, err := h.svc.CreateHabitRule(c.Request.Context(), userID, service.UpsertHabitRuleRequest{
		Title:           req.Title,
		DurationMinutes: req.DurationMinutes,
		Days:            req.Days,
		PreferredTime:   req.PreferredTime,
		PreferredStart:  req.PreferredStart,
		Required:        required,
	})
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, rule)
}

func (h *PlanningConstraintHandler) UpdateHabitRule(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid habit rule id")
		return
	}
	var req struct {
		Title           string                     `json:"title" binding:"required"`
		DurationMinutes int                        `json:"duration_minutes" binding:"required"`
		Days            []string                   `json:"days"`
		PreferredTime   domain.HabitTimePreference `json:"preferred_time"`
		PreferredStart  string                     `json:"preferred_start"`
		Required        *bool                      `json:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	required := true
	if req.Required != nil {
		required = *req.Required
	}
	rule, err := h.svc.UpdateHabitRule(c.Request.Context(), id, service.UpsertHabitRuleRequest{
		Title:           req.Title,
		DurationMinutes: req.DurationMinutes,
		Days:            req.Days,
		PreferredTime:   req.PreferredTime,
		PreferredStart:  req.PreferredStart,
		Required:        required,
	})
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, rule)
}

func (h *PlanningConstraintHandler) DeleteHabitRule(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid habit rule id")
		return
	}
	if err := h.svc.DeleteHabitRule(c.Request.Context(), id); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}
