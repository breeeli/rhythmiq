import { useNavigate } from 'react-router-dom'
import { SectionBlock } from '@/components/ui/SectionBlock'
import { GoalCard } from '@/components/goal/GoalCard'
import { useRhythmiqStore } from '@/store/rhythmiqStore'

export default function GoalsPage() {
  const navigate = useNavigate()
  const goals = useRhythmiqStore((state) => state.goals)
  const selectGoal = useRhythmiqStore((state) => state.selectGoal)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <SectionBlock
        title="Goals"
        description="目标是主结构，点进详情可以看计划、任务和排期。"
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onClick={() => {
              selectGoal(goal.id)
              navigate(`/goals/${goal.id}`)
            }}
          />
        ))}
      </div>
    </div>
  )
}
