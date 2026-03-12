package service

import (
	"context"
	"fmt"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Create(ctx context.Context, req CreateUserRequest) (*domain.User, error) {
	existing, _ := s.repo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, fmt.Errorf("email already registered")
	}

	user := &domain.User{
		Name:                req.Name,
		Email:               req.Email,
		Timezone:            orDefault(req.Timezone, "Asia/Shanghai"),
		WakeUpTime:          orDefault(req.WakeUpTime, "07:00"),
		SleepTime:           orDefault(req.SleepTime, "23:00"),
		FocusStart:          orDefault(req.FocusStart, "09:00"),
		FocusEnd:            orDefault(req.FocusEnd, "12:00"),
		MaxDailyWorkHours:   req.MaxDailyWorkHours,
	}
	if user.MaxDailyWorkHours == 0 {
		user.MaxDailyWorkHours = 8
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return user, nil
}

func (s *UserService) GetByID(ctx context.Context, id uint) (*domain.User, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *UserService) Update(ctx context.Context, id uint, req UpdateUserRequest) (*domain.User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Timezone != "" {
		user.Timezone = req.Timezone
	}
	if req.WakeUpTime != "" {
		user.WakeUpTime = req.WakeUpTime
	}
	if req.SleepTime != "" {
		user.SleepTime = req.SleepTime
	}
	if req.FocusStart != "" {
		user.FocusStart = req.FocusStart
	}
	if req.FocusEnd != "" {
		user.FocusEnd = req.FocusEnd
	}
	if req.MaxDailyWorkHours > 0 {
		user.MaxDailyWorkHours = req.MaxDailyWorkHours
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}
	return user, nil
}

func (s *UserService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

type CreateUserRequest struct {
	Name              string
	Email             string
	Timezone          string
	WakeUpTime        string
	SleepTime         string
	FocusStart        string
	FocusEnd          string
	MaxDailyWorkHours int
}

type UpdateUserRequest struct {
	Name              string
	Timezone          string
	WakeUpTime        string
	SleepTime         string
	FocusStart        string
	FocusEnd          string
	MaxDailyWorkHours int
}

func orDefault(v, def string) string {
	if v == "" {
		return def
	}
	return v
}
