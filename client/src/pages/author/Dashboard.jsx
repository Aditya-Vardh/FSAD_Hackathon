import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/StatusBadge'
import { api, authHeaders } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/format'
import Spinner from '../../components/Spinner'

export default function AuthorDashboard() {
  const { token, user } = useAuth()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/submissions/mine', authHeaders(token))
        setItems(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const stats = {
    total: items.length,
    underReview: items.filter((x) => x.paper_status === 'under_review').length,
    accepted: items.filter((x) => x.paper_status === 'accepted').length
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-blue-900">
              Welcome, {user?.name || 'Author'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">Track paper submissions and revision status.</p>
          </div>
          <Link
            to="/author/submit"
            className="rounded-xl bg-[#3b82f6] text-white px-4 py-2 text-sm font-medium hover:bg-[#2563eb] transition"
          >
            Submit Paper
          </Link>
        </div>

        {error ? <p className="text-red-700 mb-3">{error}</p> : null}
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading your papers..." />
          </div>
        ) : null}

        {!loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <p className="text-sm text-slate-600">Total Papers</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <p className="text-sm text-slate-600">Under Review</p>
              <p className="text-2xl font-bold text-[#f59e0b] mt-1">{stats.underReview}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <p className="text-sm text-slate-600">Accepted</p>
              <p className="text-2xl font-bold text-[#22c55e] mt-1">{stats.accepted}</p>
            </div>
          </div>
        ) : null}

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-800">Your Papers</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-slate-600 text-left">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Keywords</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.submission_id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{row.title}</div>
                      <div className="text-xs text-slate-500 mt-1">Submission #{row.submission_id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-700">{row.keywords || '—'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-700">{formatDate(row.submitted_at)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={row.paper_status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`http://localhost:5000/uploads/${row.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#3b82f6] hover:underline font-medium"
                        >
                          View PDF
                        </a>
                        {row.paper_status === 'revision' ? (
                          <Link
                            to={`/author/revise/${row.submission_id}`}
                            className="text-[#ea580c] hover:underline font-medium"
                          >
                            Submit Revision
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {!items.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No submissions yet.
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

