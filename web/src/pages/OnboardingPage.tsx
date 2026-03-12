import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUserStore } from '@/store'

export default function OnboardingPage() {
  const { createUser } = useUserStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    wake_up_time: '07:00',
    focus_start: '09:00',
    focus_end: '12:00',
    sleep_time: '23:00',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createUser(form)
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to Rhythmiq</h1>
          <p className="text-sm text-slate-500">Set up your profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Wake up</label>
              <input
                name="wake_up_time"
                type="time"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.wake_up_time}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sleep</label>
              <input
                name="sleep_time"
                type="time"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.sleep_time}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Focus start</label>
              <input
                name="focus_start"
                type="time"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.focus_start}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Focus end</label>
              <input
                name="focus_end"
                type="time"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.focus_end}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button type="submit" className="w-full" loading={saving}>
            Get Started
          </Button>
        </form>
      </div>
    </div>
  )
}
