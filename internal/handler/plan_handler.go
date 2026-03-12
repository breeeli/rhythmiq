package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
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
		Date string `json:"date"` // "2006-01-02", defaults to today
		Hint string `json:"hint"`
	}
	_ = c.ShouldBindJSON(&req)

	date := time.Now().UTC()
	if req.Date != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			response.BadRequest(c, "invalid date format, use YYYY-MM-DD")
			return
		}
		date = parsed
	}

	plan, err := h.svc.GeneratePlan(c.Request.Context(), userID, date, req.Hint)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, plan)
}

func (h *PlanHandler) Today(c *gin.Context) {
	userID, err := parseUint(c.Param("userID"))
	if err != nil {
		response.BadRequest(c, "invalid user_id")
		return
	}
	plan, err := h.svc.GetToday(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, err.Error())
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
