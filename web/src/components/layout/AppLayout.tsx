import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.10),_transparent_28%),linear-gradient(180deg,#f7fdfb_0%,#eef8f5_100%)]">
      <TopBar />
      <main className="min-h-[calc(100vh-64px)] overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
