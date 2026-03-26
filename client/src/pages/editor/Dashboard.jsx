import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/StatusBadge'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import { formatDate } from '../../lib/format'

export default function EditorDashboard() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/submissions')
        setItems(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.status === filter)
  }, [items, filter])

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Editor Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Review assignments, scores, and final decisions.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'decided', label: 'Decided' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={[
                'rounded-xl border px-3 py-2 text-sm font-medium transition',
                filter === tab.id
                  ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                  : 'bg-white border-gray-100 text-slate-700 hover:border-[#3b82f6]/40 hover:text-[#1d4ed8]'
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? <p className="text-red-700 mb-3">{error}</p> : null}
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading submissions..." />
          </div>
        ) : null}

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-800">Submissions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Submission</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Author</th>
                  <th className="px-4 py-3 font-semibold">Assigned reviewer</th>
                  <th className="px-4 py-3 font-semibold">Paper Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.submission_id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">#{row.submission_id}</div>
                      <div className="text-xs text-slate-500 mt-1">Submission</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{row.paper.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{row.paper.keywords || '—'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-700">{row.author.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-700">
                        {row.assigned_reviewers?.[0]?.reviewer_name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={row.paper.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-700">{formatDate(row.submitted_at)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`http://localhost:5000/uploads/${row.paper.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl border border-gray-100 hover:border-[#3b82f6]/40 transition text-[#3b82f6] text-sm font-medium bg-white"
                        >
                          View PDF
                        </a>
                        <Link
                          to={`/editor/assign/${row.submission_id}`}
                          className="px-3 py-2 rounded-xl bg-white border border-gray-100 hover:border-[#3b82f6]/40 transition text-[#3b82f6] text-sm font-medium"
                        >
                          Assign
                        </Link>
                        <Link
                          to={`/editor/decide/${row.submission_id}`}
                          className="px-3 py-2 rounded-xl bg-[#3b82f6] text-white hover:bg-[#2563eb] transition text-sm font-medium"
                        >
                          Decide
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filtered.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No submissions found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

