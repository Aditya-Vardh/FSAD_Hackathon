import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  BarChart3,
  FileText,
  Gavel,
  Home,
  Moon,
  Sun,
  LogOut,
  NotebookTabs,
  UserCheck
} from 'lucide-react'

const linksByRole = {
  author: [
    { to: '/author/dashboard', label: 'Dashboard', icon: Home },
    { to: '/author/submit', label: 'Submit Paper', icon: FileText }
  ],
  reviewer: [
    { to: '/reviewer/dashboard', label: 'Assigned Papers', icon: UserCheck }
  ],
  editor: [
    { to: '/editor/dashboard', label: 'Submissions', icon: Gavel }
  ],
  admin: [
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
  ]
}

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const role = user?.role
  const links = linksByRole[role] || []
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Guest'
  const roleBadgeClass =
    role === 'admin'
      ? 'bg-red-100 text-red-700'
      : role === 'editor'
        ? 'bg-blue-100 text-blue-700'
        : role === 'reviewer'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-slate-100 text-slate-700'

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] bg-gradient-to-b from-[#0f172a] to-[#0b1220] text-slate-100 border-r border-white/10 flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-white font-bold shadow-sm">
            <NotebookTabs className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Peer Review System</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-300 truncate">{user?.name || '—'}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadgeClass}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-2">
        <div className="space-y-1">
          {links.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                  active
                    ? 'bg-[#3b82f6] text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/5'
                ].join(' ')}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={toggleTheme}
          className="mb-3 w-full rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 transition flex items-center justify-center gap-3"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === 'light' ? 'Dark' : 'Light'} theme
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 transition text-slate-100 flex items-center gap-3 justify-center"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}

