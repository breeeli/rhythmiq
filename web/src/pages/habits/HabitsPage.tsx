import { SectionBlock } from '@/components/ui/SectionBlock'
import { HabitList } from '@/components/habit/HabitList'
import { Tag } from '@/components/ui/Tag'
import { useRhythmiqStore } from '@/store/rhythmiqStore'

export default function HabitsPage() {
  const habits = useRhythmiqStore((state) => state.habits)
  const toggleHabit = useRhythmiqStore((state) => state.toggleHabit)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock
        title="Habits"
        description="习惯是系统里稳定节奏的支点。"
        action={<Tag variant="success">{habits.filter((habit) => habit.completion > 0).length}/{habits.length}</Tag>}
      />

      <HabitList habits={habits} onToggle={toggleHabit} />
    </div>
  )
}
