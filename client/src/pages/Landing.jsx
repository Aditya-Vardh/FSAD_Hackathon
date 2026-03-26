import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { BookOpen, ChevronRight, Moon, Sun, ShieldCheck, Zap, Users } from 'lucide-react'

export default function Landing() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#0B1121]'}`}>
      
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[120px] mix-blend-screen animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite_reverse]" />

      {/* Grid overlay */}
      <div className={`pointer-events-none absolute inset-0 opacity-[0.03] ${theme === 'light' ? 'bg-black' : 'bg-white'} [mask-image:linear-gradient(to_bottom,white,transparent)] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px]`} />

      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className={`text-lg font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>PeerReview</div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className={`rounded-xl border px-3 py-2 text-sm flex items-center gap-2 transition shadow-sm ${theme === 'light' ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-8 animate-fade-in-up ${theme === 'light' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-blue-500/30 bg-blue-500/10 text-blue-300'}`}>
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Hackathon-ready System V1.0
          </div>

          <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Academic peer review,
            <br />
            <span className={`bg-gradient-to-r bg-clip-text text-transparent inline-block pb-2 ${theme === 'light' ? 'from-blue-600 via-indigo-600 to-purple-600' : 'from-blue-400 via-indigo-300 to-purple-400'}`}>
              beautifully streamlined.
            </span>
          </h1>

          <p className={`text-lg md:text-xl max-w-2xl mb-10 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
            A complete research paper submission and review workflow with dedicated dashboards for Authors, Reviewers, Editors, and Admins.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              to="/login"
              className="w-full sm:w-auto rounded-full bg-blue-600 text-white px-8 py-4 font-semibold hover:bg-blue-700 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 duration-200 transition-all inline-flex items-center justify-center gap-2"
            >
              Start Reviewing
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className={`w-full sm:w-auto rounded-full border px-8 py-4 font-semibold hover:scale-105 active:scale-95 duration-200 transition-all ${theme === 'light' ? 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:shadow-lg' : 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20'}`}
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />, title: 'Double-blind reviews', desc: 'Secure evaluation process ensuring pure meritocracy with built-in rubric scoring.' },
            { icon: <Zap className="h-6 w-6 text-amber-500" />, title: 'Instant analytics', desc: 'Real-time dashboards for editors to track submission turnaround times and decisions.' },
            { icon: <Users className="h-6 w-6 text-blue-500" />, title: 'Role-based access', desc: 'Tailored interfaces and workflows specifically designed for each stakeholder.' }
          ].map((c, i) => (
            <div key={i} className={`rounded-3xl border p-8 transition-transform hover:-translate-y-2 duration-300 ${theme === 'light' ? 'border-slate-200 bg-white shadow-xl shadow-slate-200/50' : 'border-white/10 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.04]'}`}>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 ${theme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                {c.icon}
              </div>
              <h3 className={`text-xl font-bold mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{c.title}</h3>
              <p className={`leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{c.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

