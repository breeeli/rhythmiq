package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type PlanningConstraintService struct {
	scheduleRepo repository.ScheduleRuleRepository
	habitRepo    repository.HabitRuleRepository
}

func NewPlanningConstraintService(
	scheduleRepo repository.ScheduleRuleRepository,
	habitRepo repository.HabitRuleRepository,
) *PlanningConstraintService {
	return &PlanningConstraintService{
		scheduleRepo: scheduleRepo,
		habitRepo:    habitRepo,
	}
}

type PlanningConstraints struct {
	ScheduleRules []*domain.ScheduleRule `json:"schedule_rules"`
	HabitRules    []*domain.HabitRule    `json:"habit_rules"`
}

type UpsertScheduleRuleRequest struct {
	Title     string
	Kind      domain.ScheduleRuleKind
	StartTime string
	EndTime   string
	Days      []string
	Locked    bool
}

type UpsertHabitRuleRequest struct {
	Title           string
	DurationMinutes int
	Days            []string
	PreferredTime   domain.HabitTimePreference
	PreferredStart  string
	Required        bool
}

func (s *PlanningConstraintService) List(ctx context.Context, userID uint) (*PlanningConstraints, error) {
	scheduleRules, err := s.scheduleRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list schedule rules: %w", err)
	}
	habitRules, err := s.habitRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list habit rules: %w", err)
	}
	return &PlanningConstraints{
		ScheduleRules: scheduleRules,
		HabitRules:    habitRules,
	}, nil
}

func (s *PlanningConstraintService) CreateScheduleRule(ctx context.Context, userID uint, req UpsertScheduleRuleRequest) (*domain.ScheduleRule, error) {
	if err := validateScheduleRule(req); err != nil {
		return nil, err
	}
	rule := &domain.ScheduleRule{
		UserID:    userID,
		Title:     strings.TrimSpace(req.Title),
		Kind:      defaultScheduleRuleKind(req.Kind),
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Days:      normalizeDays(req.Days),
		Locked:    req.Locked,
	}
	if err := s.scheduleRepo.Create(ctx, rule); err != nil {
		return nil, fmt.Errorf("create schedule rule: %w", err)
	}
	return rule, nil
}

func (s *PlanningConstraintService) UpdateScheduleRule(ctx context.Context, id uint, req UpsertScheduleRuleRequest) (*domain.ScheduleRule, error) {
	if err := validateScheduleRule(req); err != nil {
		return nil, err
	}
	rule, err := s.scheduleRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	rule.Title = strings.TrimSpace(req.Title)
	rule.Kind = defaultScheduleRuleKind(req.Kind)
	rule.StartTime = req.StartTime
	rule.EndTime = req.EndTime
	rule.Days = normalizeDays(req.Days)
	rule.Locked = req.Locked
	if err := s.scheduleRepo.Update(ctx, rule); err != nil {
		return nil, fmt.Errorf("update schedule rule: %w", err)
	}
	return rule, nil
}

func (s *PlanningConstraintService) DeleteScheduleRule(ctx context.Context, id uint) error {
	return s.scheduleRepo.Delete(ctx, id)
}

func (s *PlanningConstraintService) CreateHabitRule(ctx context.Context, userID uint, req UpsertHabitRuleRequest) (*domain.HabitRule, error) {
	if err := validateHabitRule(req); err != nil {
		return nil, err
	}
	rule := &domain.HabitRule{
		UserID:          userID,
		Title:           strings.TrimSpace(req.Title),
		DurationMinutes: req.DurationMinutes,
		Days:            normalizeDays(req.Days),
		PreferredTime:   defaultHabitPreference(req.PreferredTime),
		PreferredStart:  req.PreferredStart,
		Required:        req.Required,
	}
	if err := s.habitRepo.Create(ctx, rule); err != nil {
		return nil, fmt.Errorf("create habit rule: %w", err)
	}
	return rule, nil
}

func (s *PlanningConstraintService) UpdateHabitRule(ctx context.Context, id uint, req UpsertHabitRuleRequest) (*domain.HabitRule, error) {
	if err := validateHabitRule(req); err != nil {
		return nil, err
	}
	rule, err := s.habitRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	rule.Title = strings.TrimSpace(req.Title)
	rule.DurationMinutes = req.DurationMinutes
	rule.Days = normalizeDays(req.Days)
	rule.PreferredTime = defaultHabitPreference(req.PreferredTime)
	rule.PreferredStart = req.PreferredStart
	rule.Required = req.Required
	if err := s.habitRepo.Update(ctx, rule); err != nil {
		return nil, fmt.Errorf("update habit rule: %w", err)
	}
	return rule, nil
}

func (s *PlanningConstraintService) DeleteHabitRule(ctx context.Context, id uint) error {
	return s.habitRepo.Delete(ctx, id)
}

func validateScheduleRule(req UpsertScheduleRuleRequest) error {
	if strings.TrimSpace(req.Title) == "" {
		return fmt.Errorf("schedule rule title is required")
	}
	if err := validateClockRange(req.StartTime, req.EndTime); err != nil {
		return err
	}
	if len(normalizeDays(req.Days)) == 0 {
		return fmt.Errorf("schedule rule days are required")
	}
	return nil
}

func validateHabitRule(req UpsertHabitRuleRequest) error {
	if strings.TrimSpace(req.Title) == "" {
		return fmt.Errorf("habit rule title is required")
	}
	if req.DurationMinutes <= 0 {
		return fmt.Errorf("habit duration must be greater than 0")
	}
	if len(normalizeDays(req.Days)) == 0 {
		return fmt.Errorf("habit rule days are required")
	}
	if req.PreferredStart != "" {
		if _, err := parseClock(req.PreferredStart); err != nil {
			return fmt.Errorf("invalid preferred_start: %w", err)
		}
	}
	return nil
}

func defaultScheduleRuleKind(kind domain.ScheduleRuleKind) domain.ScheduleRuleKind {
	if kind == "" {
		return domain.ScheduleRuleKindFixed
	}
	return kind
}

func defaultHabitPreference(pref domain.HabitTimePreference) domain.HabitTimePreference {
	if pref == "" {
		return domain.HabitTimePreferenceAny
	}
	return pref
}

func normalizeDays(days []string) []string {
	if len(days) == 0 {
		return nil
	}
	seen := map[string]struct{}{}
	out := make([]string, 0, len(days))
	for _, day := range days {
		normalized := strings.ToLower(strings.TrimSpace(day))
		switch normalized {
		case "mon", "tue", "wed", "thu", "fri", "sat", "sun":
			if _, ok := seen[normalized]; ok {
				continue
			}
			seen[normalized] = struct{}{}
			out = append(out, normalized)
		}
	}
	return out
}
