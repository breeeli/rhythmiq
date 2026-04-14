package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type TimeBlockService struct {
	repo repository.TimeBlockRuleRepository
}

type UpsertTimeBlockRequest struct {
	Title          string
	StartTime      string
	EndTime        string
	RecurrenceType domain.TimeBlockRecurrenceType
	DaysOfWeek     []string
	Date           string
}

func NewTimeBlockService(repo repository.TimeBlockRuleRepository) *TimeBlockService {
	return &TimeBlockService{repo: repo}
}

func (s *TimeBlockService) List(ctx context.Context, userID uint) ([]*domain.TimeBlockRule, error) {
	rules, err := s.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list time blocks: %w", err)
	}
	sort.SliceStable(rules, func(i, j int) bool {
		if rules[i].RecurrenceType != rules[j].RecurrenceType {
			return rules[i].RecurrenceType < rules[j].RecurrenceType
		}
		if rules[i].Date != rules[j].Date {
			return rules[i].Date > rules[j].Date
		}
		if rules[i].StartTime != rules[j].StartTime {
			return rules[i].StartTime < rules[j].StartTime
		}
		return rules[i].Title < rules[j].Title
	})
	return rules, nil
}

func (s *TimeBlockService) Create(ctx context.Context, userID uint, req UpsertTimeBlockRequest) (*domain.TimeBlockRule, error) {
	if err := validateTimeBlockRequest(req); err != nil {
		return nil, err
	}
	rule := &domain.TimeBlockRule{
		UserID:         userID,
		Title:          strings.TrimSpace(req.Title),
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		RecurrenceType: defaultRecurrenceType(req.RecurrenceType),
		DaysOfWeek:     normalizeDays(req.DaysOfWeek),
		Date:           strings.TrimSpace(req.Date),
	}
	if err := s.repo.Create(ctx, rule); err != nil {
		return nil, fmt.Errorf("create time block: %w", err)
	}
	return rule, nil
}

func (s *TimeBlockService) Update(ctx context.Context, id uint, req UpsertTimeBlockRequest) (*domain.TimeBlockRule, error) {
	if err := validateTimeBlockRequest(req); err != nil {
		return nil, err
	}
	rule, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	rule.Title = strings.TrimSpace(req.Title)
	rule.StartTime = req.StartTime
	rule.EndTime = req.EndTime
	rule.RecurrenceType = defaultRecurrenceType(req.RecurrenceType)
	rule.DaysOfWeek = normalizeDays(req.DaysOfWeek)
	rule.Date = strings.TrimSpace(req.Date)
	if err := s.repo.Update(ctx, rule); err != nil {
		return nil, fmt.Errorf("update time block: %w", err)
	}
	return rule, nil
}

func (s *TimeBlockService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func validateTimeBlockRequest(req UpsertTimeBlockRequest) error {
	if strings.TrimSpace(req.Title) == "" {
		return fmt.Errorf("time block title is required")
	}
	if err := validateClockRange(req.StartTime, req.EndTime); err != nil {
		return err
	}
	recurrence := defaultRecurrenceType(req.RecurrenceType)
	switch recurrence {
	case domain.TimeBlockRecurrenceDaily:
		return nil
	case domain.TimeBlockRecurrenceWeekly:
		if len(normalizeDays(req.DaysOfWeek)) == 0 {
			return fmt.Errorf("weekly time blocks require at least one day")
		}
	case domain.TimeBlockRecurrenceNone:
		if strings.TrimSpace(req.Date) == "" {
			return fmt.Errorf("one-time time blocks require a date")
		}
		if _, err := time.Parse("2006-01-02", strings.TrimSpace(req.Date)); err != nil {
			return fmt.Errorf("invalid date format, use YYYY-MM-DD")
		}
	default:
		return fmt.Errorf("invalid recurrence type")
	}
	return nil
}

func defaultRecurrenceType(recurrence domain.TimeBlockRecurrenceType) domain.TimeBlockRecurrenceType {
	switch recurrence {
	case domain.TimeBlockRecurrenceNone, domain.TimeBlockRecurrenceDaily, domain.TimeBlockRecurrenceWeekly:
		return recurrence
	default:
		return domain.TimeBlockRecurrenceDaily
	}
}
