package handler

import (
	"net/http"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
	"github.com/gin-gonic/gin"
)

type TimeBlockHandler struct {
	svc *service.TimeBlockService
}

func NewTimeBlockHandler(svc *service.TimeBlockService) *TimeBlockHandler {
	return &TimeBlockHandler{svc: svc}
}

func (h *TimeBlockHandler) List(c *gin.Context) {
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

func (h *TimeBlockHandler) Create(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	var req struct {
		Title          string                         `json:"title" binding:"required"`
		StartTime      string                         `json:"start_time" binding:"required"`
		EndTime        string                         `json:"end_time" binding:"required"`
		RecurrenceType domain.TimeBlockRecurrenceType `json:"recurrence_type"`
		DaysOfWeek     []string                       `json:"days_of_week"`
		Date           string                         `json:"date"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	rule, err := h.svc.Create(c.Request.Context(), userID, service.UpsertTimeBlockRequest{
		Title:          req.Title,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		RecurrenceType: req.RecurrenceType,
		DaysOfWeek:     req.DaysOfWeek,
		Date:           req.Date,
	})
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, rule)
}

func (h *TimeBlockHandler) Update(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid time block id")
		return
	}
	var req struct {
		Title          string                         `json:"title" binding:"required"`
		StartTime      string                         `json:"start_time" binding:"required"`
		EndTime        string                         `json:"end_time" binding:"required"`
		RecurrenceType domain.TimeBlockRecurrenceType `json:"recurrence_type"`
		DaysOfWeek     []string                       `json:"days_of_week"`
		Date           string                         `json:"date"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	rule, err := h.svc.Update(c.Request.Context(), id, service.UpsertTimeBlockRequest{
		Title:          req.Title,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		RecurrenceType: req.RecurrenceType,
		DaysOfWeek:     req.DaysOfWeek,
		Date:           req.Date,
	})
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, rule)
}

func (h *TimeBlockHandler) Delete(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid time block id")
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		response.InternalError(c, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}
