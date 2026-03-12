import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useUserStore } from '@/store'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import GoalsPage from '@/pages/goals/GoalsPage'
import TasksPage from '@/pages/tasks/TasksPage'
import PlanPage from '@/pages/plan/PlanPage'
import OnboardingPage from '@/pages/OnboardingPage'

function RequireUser({ children }: { children: React.ReactNode }) {
  const currentUser = useUserStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/',
    element: (
      <RequireUser>
        <AppLayout />
      </RequireUser>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'plan', element: <PlanPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
