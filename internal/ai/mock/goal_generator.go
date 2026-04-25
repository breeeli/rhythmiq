package mock

import (
	"context"
	"strings"
	"time"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
)

type GoalGenerator struct{}

func NewGoalGenerator() *GoalGenerator {
	return &GoalGenerator{}
}

func (g *GoalGenerator) GenerateGoal(_ context.Context, req *ai.GoalGenerationRequest) (*ai.GoalGenerationResult, error) {
	prompt := "提升当前状态"
	contextText := ""
	if req != nil {
		if strings.TrimSpace(req.Prompt) != "" {
			prompt = strings.TrimSpace(req.Prompt)
		}
		contextText = strings.TrimSpace(req.ContextText)
	}

	result := ai.GoalGenerationResult{
		Goal: ai.GoalSuggestion{
			Title:       guessTitle(prompt),
			Description: buildGoalDescription(prompt, contextText),
			Priority:    domain.GoalPriorityMedium,
			Deadline:    deadlinePtr(14 * 24 * time.Hour),
			Tasks: []ai.TaskOutline{
				{Title: "厘清目标范围", Description: "把需求、边界和完成标准整理清楚。", Priority: domain.TaskPriorityHigh, EstimatedMinutes: 30},
				{Title: "拆出可执行任务", Description: "把目标拆成 3 到 5 个具体动作。", Priority: domain.TaskPriorityHigh, EstimatedMinutes: 60},
				{Title: "安排到日程里", Description: "把关键任务放进接下来几天的可用时间。", Priority: domain.TaskPriorityMedium, EstimatedMinutes: 45},
			},
		},
	}

	if strings.Contains(prompt, "健康") || strings.Contains(prompt, "减脂") || strings.Contains(prompt, "运动") {
		result.Goal.Title = "建立健康节奏"
		result.Goal.Description = "围绕运动、饮食和作息，建立一套可持续执行的健康目标。"
		result.Goal.Priority = domain.GoalPriorityHigh
		result.Goal.Tasks = []ai.TaskOutline{
			{Title: "制定每周运动计划", Description: "明确每周的运动频次和强度。", Priority: domain.TaskPriorityHigh, EstimatedMinutes: 45},
			{Title: "准备健康餐食", Description: "整理一份可复用的饮食方案。", Priority: domain.TaskPriorityMedium, EstimatedMinutes: 60},
			{Title: "固定步行与恢复时间", Description: "把日常轻运动和恢复时间纳入日程。", Priority: domain.TaskPriorityMedium, EstimatedMinutes: 30},
		}
	}

	if strings.Contains(prompt, "学习") || strings.Contains(prompt, "考试") || strings.Contains(prompt, "课程") {
		result.Goal.Title = "提升学习效率"
		result.Goal.Description = "通过分阶段学习和定期复盘，提升学习效率和输出质量。"
		result.Goal.Tasks = []ai.TaskOutline{
			{Title: "整理学习大纲", Description: "先把知识点和目标拆清楚。", Priority: domain.TaskPriorityHigh, EstimatedMinutes: 40},
			{Title: "安排每日练习", Description: "安排稳定的学习与练习节奏。", Priority: domain.TaskPriorityHigh, EstimatedMinutes: 60},
			{Title: "每周复盘输出", Description: "总结本周学习结果和待办。", Priority: domain.TaskPriorityMedium, EstimatedMinutes: 30},
		}
	}

	return &result, nil
}

func guessTitle(prompt string) string {
	trimmed := strings.TrimSpace(prompt)
	if trimmed == "" {
		return "新目标"
	}
	runes := []rune(trimmed)
	if len(runes) <= 12 {
		return trimmed
	}
	return string(runes[:12]) + "…"
}

func buildGoalDescription(prompt, contextText string) string {
	if contextText == "" {
		return "根据你的想法自动生成的目标。"
	}
	return "基于「" + prompt + "」和上下文「" + contextText + "」自动生成。"
}

func deadlinePtr(d time.Duration) *time.Time {
	t := time.Now().Add(d)
	return &t
}
