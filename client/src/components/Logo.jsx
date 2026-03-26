import { BookOpen } from 'lucide-react'

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-white shadow-sm">
        <BookOpen className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-blue-900 truncate">Peer Review System</div>
        <div className="text-xs text-slate-500 truncate">Submission + Double-Blind Review</div>
      </div>
    </div>
  )
}

