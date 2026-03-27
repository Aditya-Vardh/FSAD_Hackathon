import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import StatusBadge from '../../components/StatusBadge'
import { api, API_BASE_URL } from '../../lib/api'
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
        setError('')
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }

    if (token) load()
  }, [token])

  const filtered = useMemo(() => {
    if (filter === 'all') return items

    if (filter === 'pending')
      return items.filter(i => i.paper.status === 'submitted')

    if (filter === 'assigned')
      return items.filter(i => i.assigned_reviewers?.length)

    if (filter === 'decided')
      return items.filter(i => ['accepted', 'rejected', 'revision'].includes(i.paper.status))

    return items
  }, [items, filter])

  return (
    <div className="min-h-screen">
      <Sidebar />

      <main className="md:ml-64 p-4 md:p-8">

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-blue-900">
              Editor Dashboard
            </h1>

            <p className="text-sm text-slate-600 mt-1">
              Review assignments, scores, and final decisions.
            </p>
          </div>
        </div>


        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'decided', label: 'Decided' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={[
                'rounded-xl border px-3 py-2 text-sm font-medium transition',
                filter === tab.id
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white border-gray-100 text-slate-700 hover:border-blue-300'
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {error && (
          <p className="text-red-600 mb-3">{error}</p>
        )}


        {loading && (
          <div className="py-10">
            <Spinner label="Loading submissions..." />
          </div>
        )}


        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">

          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold">
              Submissions
            </h2>
          </div>


          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

              <thead className="bg-gray-60">
                <tr>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Assigned reviewer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>


              <tbody>

                {filtered.map(row => (
                  <tr key={row.submission_id} className="border-t">

                    <td className="px-4 py-4">
                      #{row.submission_id}
                    </td>

                    <td className="px-4 py-4">
                      {row.paper.title}
                    </td>

                    <td className="px-4 py-4">
                      {row.author.name}
                    </td>

                    <td className="px-4 py-4">
                      {row.assigned_reviewers?.[0]?.reviewer_name || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={row.paper.status} />
                    </td>

                    <td className="px-4 py-4">
                      {formatDate(row.submitted_at)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`${API_BASE_URL}/uploads/${row.paper.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
                        >
                          View File
                        </a>

                        <Link 
                          to={`/editor/assign/${row.submission_id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                        >
                          Assign
                        </Link>

                        <Link 
                          to={`/editor/decide/${row.submission_id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          Decide
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))}


                {!filtered.length && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-10">
                      No submissions found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>
    </div>
  )
}