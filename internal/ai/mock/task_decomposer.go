package mock

import (
	"context"
	"strings"

	"github.com/breeeli/rhythmiq/internal/ai"
	"github.com/breeeli/rhythmiq/internal/domain"
)

type TaskDecomposer struct{}

func NewTaskDecomposer() *TaskDecomposer {
	return &TaskDecomposer{}
}

func (d *TaskDecomposer) DecomposeTask(_ context.Context, req *ai.TaskDecompositionRequest) (*ai.TaskDecompositionResult, error) {
	title := "当前任务"
	if req != nil && req.Task != nil && strings.TrimSpace(req.Task.Title) != "" {
		title = strings.TrimSpace(req.Task.Title)
	}

	totalMinutes := 30
	priority := domain.TaskPriorityMedium
	preferWindow := "any"
	description := ""
	if req != nil && req.Task != nil {
		if req.Task.EstimatedMinutes > 0 {
			totalMinutes = req.Task.EstimatedMinutes
		}
		if req.Task.Priority != "" {
			priority = req.Task.Priority
		}
		if req.Task.PreferMorning {
			preferWindow = "morning"
		} else if req.Task.NeedsFocus {
			preferWindow = "afternoon"
		}
		description = strings.TrimSpace(req.Task.Description)
	}

	suggestions := []ai.SubtaskSuggestion{
		{
			Title:            "明确范围与完成标准",
			Description:      buildDescription(title, description, "先整理目标、边界和产出标准，避免执行过程中反复返工。"),
			Priority:         priority,
			EstimatedMinutes: portion(totalMinutes, 0.25, 15),
			PreferWindow:     preferWindow,
		},
		{
			Title:            "完成核心执行部分",
			Description:      "聚焦推进任务主体，产出最关键的结果或主要内容。",
			Priority:         priority,
			EstimatedMinutes: portion(totalMinutes, 0.5, 20),
			PreferWindow:     preferWindow,
		},
		{
			Title:            "检查结果并收尾",
			Description:      "回顾质量、补齐遗漏，并整理下一步或交付动作。",
			Priority:         priority,
			EstimatedMinutes: portion(totalMinutes, 0.25, 10),
			PreferWindow:     "any",
		},
	}

	return &ai.TaskDecompositionResult{Subtasks: suggestions}, nil
}

func buildDescription(title string, description string, fallback string) string {
	if description == "" {
		return fallback
	}
	return "结合任务“" + title + "”的描述推进：" + description
}

func portion(total int, ratio float64, min int) int {
	value := int(float64(total) * ratio)
	if value < min {
		return min
	}
	return value
}
