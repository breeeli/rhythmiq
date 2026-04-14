import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
      <TopBar />
      <div className="flex items-start">
        <Sidebar />
        <main className="min-h-[calc(100vh-73px)] flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
