import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { CalendarDays, Clock3, LayoutDashboard, Sparkles, Target } from 'lucide-react'

const nav = [
  { to: '/agent', label: '智能体', icon: Sparkles, end: true },
  { to: '/dashboard', label: '总览', icon: LayoutDashboard },
  { to: '/goals', label: '目标', icon: Target },
  { to: '/calendar', label: '日历', icon: CalendarDays },
  { to: '/time-blocks', label: '时间块', icon: Clock3 },
]

export function Sidebar() {
  return (
    <aside className="flex h-[calc(100vh-73px)] w-[248px] flex-col border-r border-slate-200 bg-slate-950 px-4 py-5 text-white">
      <div className="mb-6 rounded-[1.75rem] bg-white/6 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">Rhythmiq</p>
            <p className="text-lg font-semibold">控制中心</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'bg-white text-slate-950' : 'text-white/70 hover:bg-white/8 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.6rem] border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <p className="font-medium text-white">控制面板</p>
        <p className="mt-1 leading-6">先看 Agent，再看总览、目标、日历和时间块，保持结构清晰。</p>
      </div>
    </aside>
  )
}
