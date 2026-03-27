import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/StatusBadge'
import { api, API_BASE_URL } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import { formatDate } from '../../lib/format'
import { FileText } from 'lucide-react'

export default function ReviewerDashboard() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/reviews/assigned')
        setItems(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load assigned papers')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Reviewer Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Double-blind review assignments.</p>
          </div>
        </div>

        {error ? <p className="text-red-700 mb-3">{error}</p> : null}
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading assignments..." />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((row) => (
            <div key={row.submission_id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">Submission #{row.submission_id}</div>
                  <div className="text-xs text-slate-400 mt-1">{formatDate(row.submitted_at)}</div>
                  <h2 className="text-base font-semibold text-slate-900 mt-1">{row.paper.title}</h2>
                </div>
                <StatusBadge status={row.paper?.status || row.status} />
              </div>

              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-500 mb-1">Keywords</div>
                <div className="text-sm text-slate-700">{row.paper.keywords || '—'}</div>
              </div>

              <p className="text-sm text-slate-600 mt-3 line-clamp-4">{row.paper.abstract}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`${API_BASE_URL}/uploads/${row.paper.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  View File
                </a>
                <Link
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                  to={`/reviewer/review/${row.submission_id}`}
                >
                  {row.review.recommendation ? 'Edit Review' : 'Submit Review'}
                </Link>
              </div>
            </div>
          ))}

          {!items.length ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-slate-600">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-800">No papers assigned yet</div>
                  <div className="text-sm text-slate-500 mt-1">When an editor assigns papers, they will appear here.</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

