package service

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
	"github.com/breeeli/rhythmiq/internal/repository"
)

type PlannerService struct {
	planRepo     repository.PlanRepository
	taskRepo     repository.TaskRepository
	userRepo     repository.UserRepository
	scheduleRepo repository.ScheduleRuleRepository
	habitRepo    repository.HabitRuleRepository
	planner      ai.Planner
}

func NewPlannerService(
	planRepo repository.PlanRepository,
	taskRepo repository.TaskRepository,
	userRepo repository.UserRepository,
	scheduleRepo repository.ScheduleRuleRepository,
	habitRepo repository.HabitRuleRepository,
	planner ai.Planner,
) *PlannerService {
	return &PlannerService{
		planRepo:     planRepo,
		taskRepo:     taskRepo,
		userRepo:     userRepo,
		scheduleRepo: scheduleRepo,
		habitRepo:    habitRepo,
		planner:      planner,
	}
}

type GenerateNextDayRequest struct {
	Date          time.Time
	ContextText   string
	AnchoredItems []AnchoredPlanningItem
	FocusItems    []FocusPlanningItem
}

type AnchoredPlanningItem struct {
	Title     string `json:"title"`
	Date      string `json:"date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Note      string `json:"note"`
}

type FocusPlanningItem struct {
	Title            string `json:"title"`
	Description      string `json:"description"`
	EstimatedMinutes int    `json:"estimated_minutes"`
	Tag              string `json:"tag"`
	Priority         string `json:"priority"`
	PreferWindow     string `json:"prefer_window"`
}

var (
	ErrConstraintConflict = errors.New("planning constraints conflict")
	ErrNoSchedulableTime  = errors.New("no schedulable time remains")
)

type scheduleBlock struct {
	TaskID         *uint
	Type           domain.TimeBlockType
	Title          string
	Start          int
	End            int
	Note           string
	Description    string
	Goal           string
	ExpectedOutput string
	SourceType     domain.PlanBlockSourceType
	IsLocked       bool
}

type planningItem struct {
	TaskID         *uint
	Title          string
	Description    string
	EstimatedMins  int
	PreferWindow   string
	PriorityRank   int
	SourceType     domain.PlanBlockSourceType
	ExpectedOutput string
}

func (s *PlannerService) GeneratePlan(ctx context.Context, userID uint, req GenerateNextDayRequest) (*domain.DailyPlan, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	targetDate := normalizeDate(req.Date)

	tasks, err := s.taskRepo.FindPendingByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("fetch tasks: %w", err)
	}
	scheduleRules, err := s.scheduleRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("fetch schedule rules: %w", err)
	}
	habitRules, err := s.habitRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("fetch habit rules: %w", err)
	}

	blocks, anchoredForAI, err := s.buildCandidateBlocks(targetDate, tasks, scheduleRules, habitRules, req)
	if err != nil {
		return nil, err
	}

	aiBlocks := make([]ai.CandidateBlock, 0, len(blocks))
	for _, block := range blocks {
		aiBlocks = append(aiBlocks, ai.CandidateBlock{
			TaskID:         block.TaskID,
			Type:           block.Type,
			Title:          block.Title,
			StartTime:      formatClock(block.Start),
			EndTime:        formatClock(block.End),
			Note:           block.Note,
			Description:    block.Description,
			Goal:           block.Goal,
			ExpectedOutput: block.ExpectedOutput,
			SourceType:     block.SourceType,
			IsLocked:       block.IsLocked,
		})
	}

	result, err := s.planner.GenerateDailyPlan(ctx, &ai.PlanRequest{
		User:            user,
		Tasks:           tasks,
		Date:            targetDate,
		ContextText:     req.ContextText,
		AnchoredItems:   anchoredForAI,
		CandidateBlocks: aiBlocks,
	})
	if err != nil {
		return nil, fmt.Errorf("planner enrich: %w", err)
	}

	if err := validatePlannerResponse(aiBlocks, result.TimeBlocks); err != nil {
		return nil, err
	}

	existing, _ := s.planRepo.FindByUserIDAndDate(ctx, userID, targetDate)
	plan := &domain.DailyPlan{
		UserID:  userID,
		Date:    targetDate,
		Status:  domain.PlanStatusDraft,
		Summary: result.Summary,
		Context: req.ContextText,
	}
	for _, block := range result.TimeBlocks {
		plan.TimeBlocks = append(plan.TimeBlocks, domain.TimeBlock{
			TaskID:         block.TaskID,
			Type:           block.Type,
			Title:          block.Title,
			StartTime:      block.StartTime,
			EndTime:        block.EndTime,
			Note:           block.Note,
			Description:    block.Description,
			Goal:           block.Goal,
			ExpectedOutput: block.ExpectedOutput,
			SourceType:     block.SourceType,
			IsLocked:       block.IsLocked,
		})
	}

	if existing != nil {
		plan.ID = existing.ID
		plan.CreatedAt = existing.CreatedAt
		if err := s.planRepo.Update(ctx, plan); err != nil {
			return nil, fmt.Errorf("update plan: %w", err)
		}
		return plan, nil
	}
	if err := s.planRepo.Create(ctx, plan); err != nil {
		return nil, fmt.Errorf("create plan: %w", err)
	}
	return plan, nil
}

func (s *PlannerService) GetByDate(ctx context.Context, userID uint, date time.Time) (*domain.DailyPlan, error) {
	return s.planRepo.FindByUserIDAndDate(ctx, userID, normalizeDate(date))
}

func (s *PlannerService) ConfirmPlan(ctx context.Context, planID uint) (*domain.DailyPlan, error) {
	plan, err := s.planRepo.FindByID(ctx, planID)
	if err != nil {
		return nil, err
	}
	plan.Status = domain.PlanStatusConfirmed
	if err := s.planRepo.Update(ctx, plan); err != nil {
		return nil, err
	}
	return plan, nil
}

func (s *PlannerService) buildCandidateBlocks(
	targetDate time.Time,
	tasks []*domain.Task,
	scheduleRules []*domain.ScheduleRule,
	habitRules []*domain.HabitRule,
	req GenerateNextDayRequest,
) ([]scheduleBlock, []ai.AnchoredItem, error) {
	dayStart, err := parseClock("06:00")
	if err != nil {
		return nil, nil, err
	}
	dayEnd, err := parseClock("23:59")
	if err != nil {
		return nil, nil, err
	}

	lockedBlocks := make([]scheduleBlock, 0)
	anchoredForAI := make([]ai.AnchoredItem, 0, len(req.AnchoredItems))
	for _, rule := range scheduleRules {
		if !appliesOnDate(rule.Days, targetDate) {
			continue
		}
		start, err := parseClock(rule.StartTime)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid schedule rule %q start time: %w", rule.Title, err)
		}
		end, err := parseClock(rule.EndTime)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid schedule rule %q end time: %w", rule.Title, err)
		}
		lockedBlocks = append(lockedBlocks, scheduleBlock{
			Type:           scheduleRuleBlockType(rule.Kind),
			Title:          rule.Title,
			Start:          start,
			End:            end,
			Note:           "Saved fixed schedule",
			Description:    "Time reserved by your saved schedule.",
			Goal:           "Protect this fixed block from flexible planning.",
			ExpectedOutput: "Completed fixed schedule block.",
			SourceType:     domain.PlanBlockSourceSchedule,
			IsLocked:       rule.Locked,
		})
	}

	for _, item := range req.AnchoredItems {
		if strings.TrimSpace(item.Title) == "" {
			return nil, nil, fmt.Errorf("anchored item title is required")
		}
		if strings.TrimSpace(item.Date) == "" {
			return nil, nil, fmt.Errorf("anchored item %q date is required", item.Title)
		}
		itemDate, err := time.Parse("2006-01-02", item.Date)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid anchored item %q date format, use YYYY-MM-DD", item.Title)
		}
		if !normalizeDate(itemDate).Equal(targetDate) {
			return nil, nil, fmt.Errorf("anchored item %q date must match target date %s", item.Title, targetDate.Format("2006-01-02"))
		}
		if err := validateClockRange(item.StartTime, item.EndTime); err != nil {
			return nil, nil, fmt.Errorf("invalid anchored item %q: %w", item.Title, err)
		}
		start, _ := parseClock(item.StartTime)
		end, _ := parseClock(item.EndTime)
		lockedBlocks = append(lockedBlocks, scheduleBlock{
			Type:           domain.TimeBlockTypeWork,
			Title:          item.Title,
			Start:          start,
			End:            end,
			Note:           firstNonEmpty(item.Note, "Fixed-time item from current context."),
			Description:    "Fixed-time item provided for this planning request.",
			Goal:           "Respect this anchored commitment.",
			ExpectedOutput: "Attend or finish the anchored item as planned.",
			SourceType:     domain.PlanBlockSourceAnchor,
			IsLocked:       true,
		})
		anchoredForAI = append(anchoredForAI, ai.AnchoredItem{
			Title:     item.Title,
			Date:      item.Date,
			StartTime: item.StartTime,
			EndTime:   item.EndTime,
			Note:      item.Note,
		})
	}

	sortBlocks(lockedBlocks)
	if err := detectOverlap(lockedBlocks); err != nil {
		return nil, nil, err
	}

	for _, rule := range habitRules {
		if !appliesOnDate(rule.Days, targetDate) {
			continue
		}
		block, placeErr := placeHabitBlock(rule, lockedBlocks)
		if placeErr != nil {
			if rule.Required {
				return nil, nil, placeErr
			}
			continue
		}
		lockedBlocks = append(lockedBlocks, block)
		sortBlocks(lockedBlocks)
		if err := detectOverlap(lockedBlocks); err != nil {
			return nil, nil, err
		}
	}

	windows := availableWindows(lockedBlocks, dayStart, dayEnd)
	if len(windows) == 0 {
		return nil, nil, ErrNoSchedulableTime
	}

	flexibleItems := buildPlanningItems(tasks, req.FocusItems)
	flexibleBlocks := scheduleFlexibleBlocks(flexibleItems, windows)

	allBlocks := append([]scheduleBlock{}, lockedBlocks...)
	allBlocks = append(allBlocks, flexibleBlocks...)

	if reviewBlock, ok := placeReviewBlock(append([]scheduleBlock{}, allBlocks...), dayEnd); ok {
		allBlocks = append(allBlocks, reviewBlock)
	}
	sortBlocks(allBlocks)

	return allBlocks, anchoredForAI, nil
}

func validatePlannerResponse(source []ai.CandidateBlock, result []ai.CandidateBlock) error {
	if len(source) != len(result) {
		return fmt.Errorf("planner returned %d blocks, expected %d", len(result), len(source))
	}
	for i := range source {
		if source[i].StartTime != result[i].StartTime || source[i].EndTime != result[i].EndTime {
			return fmt.Errorf("planner changed reserved time window for block %q", source[i].Title)
		}
		if source[i].SourceType != result[i].SourceType || source[i].IsLocked != result[i].IsLocked {
			return fmt.Errorf("planner changed protected metadata for block %q", source[i].Title)
		}
	}
	return nil
}

func buildPlanningItems(tasks []*domain.Task, focusItems []FocusPlanningItem) []planningItem {
	items := make([]planningItem, 0, len(tasks)+len(focusItems))
	for _, item := range focusItems {
		title := strings.TrimSpace(item.Title)
		if title == "" {
			continue
		}
		minutes := item.EstimatedMinutes
		if minutes <= 0 {
			minutes = 45
		}
		items = append(items, planningItem{
			Title:          title,
			Description:    item.Description,
			EstimatedMins:  minutes,
			PreferWindow:   normalizePreferWindow(item.PreferWindow),
			PriorityRank:   priorityRank(item.Priority),
			SourceType:     domain.PlanBlockSourceContext,
			ExpectedOutput: inferOutputFromTag(item.Tag, title),
		})
	}
	for _, task := range tasks {
		if task.Status == domain.TaskStatusDone || task.Status == domain.TaskStatusSkipped {
			continue
		}
		taskID := task.ID
		items = append(items, planningItem{
			TaskID:         &taskID,
			Title:          task.Title,
			Description:    task.Description,
			EstimatedMins:  maxInt(task.EstimatedMinutes, 30),
			PreferWindow:   preferWindowForTask(task),
			PriorityRank:   priorityRank(string(task.Priority)),
			SourceType:     domain.PlanBlockSourceTask,
			ExpectedOutput: fmt.Sprintf("Progress recorded for task %q.", task.Title),
		})
	}
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].PriorityRank == items[j].PriorityRank {
			return items[i].EstimatedMins < items[j].EstimatedMins
		}
		return items[i].PriorityRank < items[j].PriorityRank
	})
	return items
}

func scheduleFlexibleBlocks(items []planningItem, windows [][2]int) []scheduleBlock {
	blocks := make([]scheduleBlock, 0)
	for _, item := range items {
		index, start, end, ok := selectWindow(item, windows)
		if !ok {
			continue
		}
		blocks = append(blocks, scheduleBlock{
			TaskID:         item.TaskID,
			Type:           domain.TimeBlockTypeWork,
			Title:          item.Title,
			Start:          start,
			End:            end,
			Note:           "Scheduled in an available window.",
			Description:    firstNonEmpty(item.Description, "Focused planning block."),
			Goal:           fmt.Sprintf("Make concrete progress on %s.", strings.ToLower(item.Title)),
			ExpectedOutput: item.ExpectedOutput,
			SourceType:     item.SourceType,
		})
		windows[index][0] = end + 10
		if windows[index][0] >= windows[index][1] {
			windows = append(windows[:index], windows[index+1:]...)
		}
	}
	return blocks
}

func selectWindow(item planningItem, windows [][2]int) (int, int, int, bool) {
	ordered := preferredWindowRanges(item.PreferWindow)
	for _, preferred := range ordered {
		for i, window := range windows {
			start := maxInt(window[0], preferred[0])
			end := start + item.EstimatedMins
			if end <= minInt(window[1], preferred[1]) {
				return i, start, end, true
			}
		}
	}
	for i, window := range windows {
		start := window[0]
		end := start + item.EstimatedMins
		if end <= window[1] {
			return i, start, end, true
		}
	}
	return 0, 0, 0, false
}

func placeHabitBlock(rule *domain.HabitRule, lockedBlocks []scheduleBlock) (scheduleBlock, error) {
	duration := rule.DurationMinutes
	if duration <= 0 {
		return scheduleBlock{}, fmt.Errorf("invalid habit duration for %q", rule.Title)
	}

	if rule.PreferredStart != "" {
		start, err := parseClock(rule.PreferredStart)
		if err != nil {
			return scheduleBlock{}, fmt.Errorf("invalid preferred_start for habit %q: %w", rule.Title, err)
		}
		block := scheduleBlock{
			Type:           domain.TimeBlockTypePersonal,
			Title:          rule.Title,
			Start:          start,
			End:            start + duration,
			Note:           "Saved repeating habit",
			Description:    "Recurring habit reserved before flexible scheduling.",
			Goal:           fmt.Sprintf("Complete the habit: %s.", strings.ToLower(rule.Title)),
			ExpectedOutput: "Habit completed as planned.",
			SourceType:     domain.PlanBlockSourceHabit,
			IsLocked:       true,
		}
		if intersectsAny(block, lockedBlocks) {
			return scheduleBlock{}, fmt.Errorf("%w: habit %q conflicts with locked time", ErrConstraintConflict, rule.Title)
		}
		return block, nil
	}

	for _, rng := range preferredWindowRanges(string(rule.PreferredTime)) {
		windows := availableWindows(lockedBlocks, rng[0], rng[1])
		for _, window := range windows {
			if window[1]-window[0] >= duration {
				return scheduleBlock{
					Type:           domain.TimeBlockTypePersonal,
					Title:          rule.Title,
					Start:          window[0],
					End:            window[0] + duration,
					Note:           "Saved repeating habit",
					Description:    "Recurring habit reserved before flexible scheduling.",
					Goal:           fmt.Sprintf("Complete the habit: %s.", strings.ToLower(rule.Title)),
					ExpectedOutput: "Habit completed as planned.",
					SourceType:     domain.PlanBlockSourceHabit,
					IsLocked:       true,
				}, nil
			}
		}
	}

	return scheduleBlock{}, fmt.Errorf("%w: unable to place required habit %q", ErrConstraintConflict, rule.Title)
}

func placeReviewBlock(existing []scheduleBlock, dayEnd int) (scheduleBlock, bool) {
	sortBlocks(existing)
	windows := availableWindows(existing, 20*60, dayEnd)
	for _, window := range windows {
		if window[1]-window[0] >= 30 {
			end := minInt(window[1], dayEnd)
			start := end - 30
			return scheduleBlock{
				Type:           domain.TimeBlockTypeBuffer,
				Title:          "Review today and check tomorrow",
				Start:          start,
				End:            end,
				Note:           "Daily planning buffer.",
				Description:    "Review completed work and confirm tomorrow's plan.",
				Goal:           "Close the day with a short retrospective.",
				ExpectedOutput: "A short review and updated next-day priorities.",
				SourceType:     domain.PlanBlockSourceReview,
			}, true
		}
	}
	return scheduleBlock{}, false
}

func availableWindows(blocks []scheduleBlock, start int, end int) [][2]int {
	if start >= end {
		return nil
	}
	sortBlocks(blocks)
	windows := make([][2]int, 0)
	cursor := start
	for _, block := range blocks {
		if block.End <= start || block.Start >= end {
			continue
		}
		if block.Start > cursor {
			windows = append(windows, [2]int{cursor, minInt(block.Start, end)})
		}
		if block.End > cursor {
			cursor = block.End
		}
		if cursor >= end {
			return windows
		}
	}
	if cursor < end {
		windows = append(windows, [2]int{cursor, end})
	}
	return windows
}

func detectOverlap(blocks []scheduleBlock) error {
	if len(blocks) == 0 {
		return nil
	}
	sortBlocks(blocks)
	for i := 1; i < len(blocks); i++ {
		if blocks[i].Start < blocks[i-1].End {
			return fmt.Errorf("%w: %q overlaps %q", ErrConstraintConflict, blocks[i-1].Title, blocks[i].Title)
		}
	}
	return nil
}

func intersectsAny(target scheduleBlock, blocks []scheduleBlock) bool {
	for _, block := range blocks {
		if target.Start < block.End && block.Start < target.End {
			return true
		}
	}
	return false
}

func appliesOnDate(days []string, targetDate time.Time) bool {
	if len(days) == 0 {
		return false
	}
	weekday := [...]string{"sun", "mon", "tue", "wed", "thu", "fri", "sat"}[targetDate.Weekday()]
	for _, day := range days {
		if strings.ToLower(day) == weekday {
			return true
		}
	}
	return false
}

func normalizeDate(date time.Time) time.Time {
	if date.IsZero() {
		date = time.Now().UTC().Add(24 * time.Hour)
	}
	return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
}

func validateClockRange(start string, end string) error {
	startMins, err := parseClock(start)
	if err != nil {
		return fmt.Errorf("invalid start_time: %w", err)
	}
	endMins, err := parseClock(end)
	if err != nil {
		return fmt.Errorf("invalid end_time: %w", err)
	}
	if endMins <= startMins {
		return fmt.Errorf("end time must be later than start time")
	}
	return nil
}

func parseClock(value string) (int, error) {
	t, err := time.Parse("15:04", value)
	if err != nil {
		return 0, err
	}
	return t.Hour()*60 + t.Minute(), nil
}

func formatClock(minutes int) string {
	if minutes < 0 {
		minutes = 0
	}
	if minutes > 23*60+59 {
		minutes = 23*60 + 59
	}
	return fmt.Sprintf("%02d:%02d", minutes/60, minutes%60)
}

func preferredWindowRanges(window string) [][2]int {
	switch normalizePreferWindow(window) {
	case "morning":
		return [][2]int{{6 * 60, 12 * 60}, {12 * 60, 18 * 60}, {18 * 60, 23*60 + 59}}
	case "afternoon":
		return [][2]int{{12 * 60, 18 * 60}, {18 * 60, 23*60 + 59}, {6 * 60, 12 * 60}}
	case "evening":
		return [][2]int{{18 * 60, 23*60 + 59}, {12 * 60, 18 * 60}, {6 * 60, 12 * 60}}
	default:
		return [][2]int{{6 * 60, 23*60 + 59}}
	}
}

func normalizePreferWindow(window string) string {
	switch strings.ToLower(strings.TrimSpace(window)) {
	case "morning", "afternoon", "evening":
		return strings.ToLower(strings.TrimSpace(window))
	default:
		return "any"
	}
}

func preferWindowForTask(task *domain.Task) string {
	if task.PreferMorning {
		return "morning"
	}
	if task.NeedsFocus {
		return "afternoon"
	}
	return "any"
}

func priorityRank(priority string) int {
	switch strings.ToLower(strings.TrimSpace(priority)) {
	case "high":
		return 0
	case "medium":
		return 1
	default:
		return 2
	}
}

func inferOutputFromTag(tag string, title string) string {
	switch strings.ToLower(strings.TrimSpace(tag)) {
	case "learning":
		return "Reading notes or a short concept summary."
	case "work":
		return "A concrete work deliverable ready to share."
	case "project":
		return "Visible project progress or a documented next step."
	default:
		return fmt.Sprintf("A concrete result for %s.", strings.ToLower(title))
	}
}

func scheduleRuleBlockType(kind domain.ScheduleRuleKind) domain.TimeBlockType {
	if kind == domain.ScheduleRuleKindBlocked {
		return domain.TimeBlockTypeBreak
	}
	return domain.TimeBlockTypePersonal
}

func sortBlocks(blocks []scheduleBlock) {
	sort.SliceStable(blocks, func(i, j int) bool {
		if blocks[i].Start == blocks[j].Start {
			return blocks[i].End < blocks[j].End
		}
		return blocks[i].Start < blocks[j].Start
	})
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
