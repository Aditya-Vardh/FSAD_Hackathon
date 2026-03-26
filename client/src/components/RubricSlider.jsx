export default function RubricSlider({ label, value, onChange, min = 1, max = 5 }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
          {value}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#3b82f6] cursor-pointer"
      />

      <div className="mt-2 flex justify-between text-xs text-slate-500">
        {Array.from({ length: max - min + 1 }).map((_, idx) => {
          const n = min + idx
          return <span key={n}>{n}</span>
        })}
      </div>
    </div>
  )
}

