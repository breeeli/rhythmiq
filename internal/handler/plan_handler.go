package handler

import (
	"errors"
	"time"

	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
	"github.com/gin-gonic/gin"
)

type PlanHandler struct {
	svc *service.PlannerService
}

func NewPlanHandler(svc *service.PlannerService) *PlanHandler {
	return &PlanHandler{svc: svc}
}

func (h *PlanHandler) Generate(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}

	var req struct {
		Date          string `json:"date"` // "2006-01-02", defaults to tomorrow
		ContextText   string `json:"context_text"`
		AnchoredItems []struct {
			Title     string `json:"title"`
			Date      string `json:"date"`
			StartTime string `json:"start_time"`
			EndTime   string `json:"end_time"`
			Note      string `json:"note"`
		} `json:"anchored_items"`
		FocusItems []struct {
			Title            string `json:"title"`
			Description      string `json:"description"`
			EstimatedMinutes int    `json:"estimated_minutes"`
			Tag              string `json:"tag"`
			Priority         string `json:"priority"`
			PreferWindow     string `json:"prefer_window"`
		} `json:"focus_items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	date := time.Now().UTC().Add(24 * time.Hour)
	if req.Date != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			response.BadRequest(c, "invalid date format, use YYYY-MM-DD")
			return
		}
		date = parsed
	}

	anchoredItems := make([]service.AnchoredPlanningItem, 0, len(req.AnchoredItems))
	for _, item := range req.AnchoredItems {
		anchoredItems = append(anchoredItems, service.AnchoredPlanningItem{
			Title:     item.Title,
			Date:      item.Date,
			StartTime: item.StartTime,
			EndTime:   item.EndTime,
			Note:      item.Note,
		})
	}
	focusItems := make([]service.FocusPlanningItem, 0, len(req.FocusItems))
	for _, item := range req.FocusItems {
		focusItems = append(focusItems, service.FocusPlanningItem{
			Title:            item.Title,
			Description:      item.Description,
			EstimatedMinutes: item.EstimatedMinutes,
			Tag:              item.Tag,
			Priority:         item.Priority,
			PreferWindow:     item.PreferWindow,
		})
	}

	plan, err := h.svc.GeneratePlan(c.Request.Context(), userID, service.GenerateNextDayRequest{
		Date:          date,
		ContextText:   req.ContextText,
		AnchoredItems: anchoredItems,
		FocusItems:    focusItems,
	})
	if err != nil {
		if errors.Is(err, service.ErrConstraintConflict) {
			response.Conflict(c, err.Error())
			return
		}
		if errors.Is(err, service.ErrNoSchedulableTime) {
			response.Conflict(c, err.Error())
			return
		}
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, plan)
}

func (h *PlanHandler) ByDate(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	date := time.Now().UTC().Add(24 * time.Hour)
	if rawDate := c.Query("date"); rawDate != "" {
		parsed, err := time.Parse("2006-01-02", rawDate)
		if err != nil {
			response.BadRequest(c, "invalid date format, use YYYY-MM-DD")
			return
		}
		date = parsed
	}
	plan, err := h.svc.GetByDate(c.Request.Context(), userID, date)
	if err != nil {
		response.NotFound(c, "plan not found")
		return
	}
	response.OK(c, plan)
}

func (h *PlanHandler) Confirm(c *gin.Context) {
	planID, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid plan id")
		return
	}
	plan, err := h.svc.ConfirmPlan(c.Request.Context(), planID)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, plan)
}
