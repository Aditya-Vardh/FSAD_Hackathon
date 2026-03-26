const classes = {
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  revision: 'bg-orange-100 text-orange-700'
}

function toLabel(status) {
  return String(status || '')
    .replaceAll('_', ' ')
    .replace(/\b[a-z]/g, (m) => m.toUpperCase())
}

export default function StatusBadge({ status }) {
  const key = String(status || '').replaceAll(' ', '_')
  const normalized = key === 'revision_required' ? 'revision' : key
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        classes[normalized] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {toLabel(normalized)}
    </span>
  )
}

