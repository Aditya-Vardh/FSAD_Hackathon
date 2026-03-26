export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div className="h-4 w-4 rounded-full border-2 border-[#3b82f6]/30 border-t-[#3b82f6] animate-spin" />
      <span>{label}</span>
    </div>
  )
}

