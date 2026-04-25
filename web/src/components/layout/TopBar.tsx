import clsx from 'clsx'
import {
  BarChart3,
  Bell,
  CalendarDays,
  Clock3,
  LayoutGrid,
  Sparkles,
  Target,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useUserStore } from '@/store'

const navItems = [
  { to: '/agent', label: '工作台', icon: LayoutGrid, end: true },
  { to: '/calendar', label: '日程', icon: CalendarDays },
  { to: '/goals', label: '目标', icon: Target },
  { to: '/time-blocks', label: '时间块', icon: Clock3 },
  { to: '/dashboard', label: '统计', icon: BarChart3 },
]

function getInitials(name?: string) {
  if (!name?.trim()) return '访'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function TopBar() {
  const currentUser = useUserStore((state) => state.currentUser)
  const initials = getInitials(currentUser?.name)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="relative flex min-h-16 items-center gap-4 px-4 lg:px-6">
        <NavLink to="/agent" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-600 ring-1 ring-teal-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight text-slate-950">Rhythmiq</p>
          </div>
        </NavLink>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'group relative inline-flex h-16 shrink-0 items-center gap-2 px-4 text-sm font-medium transition-colors outline-none',
                  isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx('h-4 w-4 transition-colors', isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-700')} />
                  <span>{label}</span>
                  <span
                    className={clsx(
                      'absolute inset-x-3 bottom-0 h-0.5 rounded-md bg-teal-600 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <nav className="mx-auto flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto px-2 md:hidden">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'group relative inline-flex h-16 shrink-0 items-center gap-2 px-4 text-sm font-medium transition-colors outline-none',
                  isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx('h-4 w-4 transition-colors', isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-700')} />
                  <span>{label}</span>
                  <span
                    className={clsx(
                      'absolute inset-x-3 bottom-0 h-0.5 rounded-md bg-teal-600 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            aria-label="通知"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-teal-50 hover:text-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-100"
          >
            <Bell className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label={currentUser?.name ?? '访客'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  )
}
