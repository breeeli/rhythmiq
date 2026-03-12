package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/breeeli/rhythmiq/internal/service"
	"github.com/breeeli/rhythmiq/pkg/response"
)

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) Create(c *gin.Context) {
	var req struct {
		Name              string `json:"name" binding:"required"`
		Email             string `json:"email" binding:"required,email"`
		Timezone          string `json:"timezone"`
		WakeUpTime        string `json:"wake_up_time"`
		SleepTime         string `json:"sleep_time"`
		FocusStart        string `json:"focus_start"`
		FocusEnd          string `json:"focus_end"`
		MaxDailyWorkHours int    `json:"max_daily_work_hours"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.svc.Create(c.Request.Context(), service.CreateUserRequest{
		Name:              req.Name,
		Email:             req.Email,
		Timezone:          req.Timezone,
		WakeUpTime:        req.WakeUpTime,
		SleepTime:         req.SleepTime,
		FocusStart:        req.FocusStart,
		FocusEnd:          req.FocusEnd,
		MaxDailyWorkHours: req.MaxDailyWorkHours,
	})
	if err != nil {
		response.Conflict(c, err.Error())
		return
	}
	response.Created(c, user)
}

func (h *UserHandler) Get(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}
	user, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req struct {
		Name              string `json:"name"`
		Timezone          string `json:"timezone"`
		WakeUpTime        string `json:"wake_up_time"`
		SleepTime         string `json:"sleep_time"`
		FocusStart        string `json:"focus_start"`
		FocusEnd          string `json:"focus_end"`
		MaxDailyWorkHours int    `json:"max_daily_work_hours"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.svc.Update(c.Request.Context(), id, service.UpdateUserRequest{
		Name:              req.Name,
		Timezone:          req.Timezone,
		WakeUpTime:        req.WakeUpTime,
		SleepTime:         req.SleepTime,
		FocusStart:        req.FocusStart,
		FocusEnd:          req.FocusEnd,
		MaxDailyWorkHours: req.MaxDailyWorkHours,
	})
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) Delete(c *gin.Context) {
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

func parseUint(s string) (uint, error) {
	v, err := strconv.ParseUint(s, 10, 64)
	return uint(v), err
}
