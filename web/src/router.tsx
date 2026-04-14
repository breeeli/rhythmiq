import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUserStore } from '@/store'
import AgentPage from '@/pages/agent/AgentPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import GoalsPage from '@/pages/goals/GoalsPage'
import GoalDetailPage from '@/pages/goals/GoalDetailPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import HabitsPage from '@/pages/habits/HabitsPage'

function RequireUser({ children }: { children: React.ReactNode }) {
  const currentUser = useUserStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/agent" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireUser>
        <AppLayout />
      </RequireUser>
    ),
    children: [
      { index: true, element: <Navigate to="/agent" replace /> },
      { path: 'agent', element: <AgentPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'goals/:goalId', element: <GoalDetailPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'habits', element: <HabitsPage /> },
      { path: 'plan', element: <Navigate to="/habits" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/agent" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
