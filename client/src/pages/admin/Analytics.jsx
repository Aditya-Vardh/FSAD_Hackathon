import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import Sidebar from '../../components/Sidebar'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { formatDate } from '../../lib/format'

function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="text-2xl font-semibold text-blue-900 mt-1">{value}</p>
    </div>
  )
}

export default function AdminAnalytics() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/admin/analytics')
        setData(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load analytics')
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
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Admin Analytics</h1>
          <p className="text-sm text-slate-600 mt-1">Acceptance metrics, turnaround time, and status distribution.</p>
        </div>

        {error ? <p className="text-red-700 mb-3">{error}</p> : null}
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading analytics..." />
          </div>
        ) : null}

        {data && !loading ? (
          <>
            {(() => {
              const submitted = Number(data.submissionsByStatus?.submitted ?? 0)
              const underReview = Number(data.submissionsByStatus?.under_review ?? 0)
              const accepted = Number(data.submissionsByStatus?.accepted ?? 0)
              const rejected = Number(data.submissionsByStatus?.rejected ?? 0)
              const pending = submitted + underReview
              const statusColors = {
                submitted: '#3b82f6',
                under_review: '#f59e0b',
                accepted: '#22c55e',
                rejected: '#ef4444',
                revision: '#f97316'
              }

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
                    <StatCard title="Total submissions" value={data.totalSubmissions} />
                    <StatCard title="Accepted" value={accepted} />
                    <StatCard title="Rejected" value={rejected} />
                    <StatCard title="Pending" value={pending} />
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 h-[360px]">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <p className="font-semibold text-slate-800">Submissions by Status</p>
                      <div className="text-xs text-slate-500">
                        Avg turnaround: {data.avgTurnaroundTimeHours}h • Acceptance rate: {data.acceptanceRate}%
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.submissionsByStatusArray}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis allowDecimals={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                          contentStyle={{ backgroundColor: 'var(--app-bg)', borderRadius: '12px', borderColor: 'rgba(148, 163, 184, 0.2)', color: 'var(--app-fg)' }}
                          itemStyle={{ color: 'var(--app-fg)', fontWeight: 600 }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {data.submissionsByStatusArray.map((entry) => (
                            <Cell key={entry.status} fill={statusColors[entry.status] || '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )
            })()}
          </>
        ) : null}

        {data && data.recentSubmissions?.length ? (
          <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-slate-800">Recent Submissions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Author</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSubmissions.map((r, idx) => (
                    <tr key={`${r.title}-${idx}`} className="border-t border-gray-100">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{r.title}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-700">{r.author || '—'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-700">{formatDate(r.submitted_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

