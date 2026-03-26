import { Link } from 'react-router-dom'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function AuthShell({ title, subtitle, children, footer }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
      {/* vignette */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${theme === 'light' ? 'from-white/50 via-transparent to-white/50' : 'from-black/25 via-transparent to-black/35'}`} />

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-3 text-[color:var(--app-fg)]">
          <div className="h-10 w-10 rounded-2xl bg-[#3b82f6] text-white flex items-center justify-center shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold">Peer Review System</div>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl border border-white/15 bg-white/5 text-[color:var(--app-fg)] px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/10 transition"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className={`rounded-3xl border backdrop-blur-xl shadow-2xl p-7 ${theme === 'light' ? 'border-slate-200 bg-white/80' : 'border-white/15 bg-white/5'}`}>
          <h1 className="text-xl md:text-2xl font-bold text-[color:var(--app-fg)]">{title}</h1>
          {subtitle ? <p className={`text-sm mt-2 ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>{subtitle}</p> : null}

          <div className="mt-6">{children}</div>

          {footer ? <div className={`mt-5 text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}

