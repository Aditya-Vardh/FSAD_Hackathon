import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function DecideSubmission() {
  const { submissionId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ verdict: 'accepted', comments: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/submissions/${submissionId}/reviews`)
        setReviews(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load reviews')
      }
    }
    load()
  }, [submissionId, token])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/api/decisions/${submissionId}`, form)
      navigate('/editor/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save decision')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Final Decision</h1>
          <p className="text-sm text-slate-600 mt-1">Submission #{submissionId} — review scores below.</p>
        </div>

        {error ? <p className="text-red-700 mb-3">{error}</p> : null}

        {reviews[0]?.paper_title ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-slate-500">Paper</div>
                <h2 className="text-lg font-semibold text-slate-900 mt-1">{reviews[0].paper_title}</h2>
                <div className="text-sm text-slate-600 mt-1">
                  Keywords: {reviews[0].paper_keywords || '—'}
                </div>
              </div>
              {reviews[0]?.paper_file_path ? (
                <a
                  href={`http://localhost:5000/uploads/${reviews[0].paper_file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#3b82f6] text-white px-4 py-2 text-sm font-medium hover:bg-[#2563eb] transition"
                >
                  View PDF
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Reviewer Scores</h2>
          {reviews.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{r.reviewer_name}</div>
                      <div className="text-xs text-slate-500 mt-1">Recommendation: {r.recommendation || '—'}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {(() => {
                      const avg = (Number(r.originality ?? 0) + Number(r.methodology ?? 0) + Number(r.clarity ?? 0) + Number(r.significance ?? 0)) / 4
                      return (
                        <>
                          <div className="rounded-xl bg-slate-50 border border-gray-100 p-3">
                            <div className="text-xs font-semibold text-slate-500">Originality</div>
                            <div className="font-semibold text-slate-900">{r.originality}/5</div>
                          </div>
                          <div className="rounded-xl bg-slate-50 border border-gray-100 p-3">
                            <div className="text-xs font-semibold text-slate-500">Methodology</div>
                            <div className="font-semibold text-slate-900">{r.methodology}/5</div>
                          </div>
                          <div className="rounded-xl bg-slate-50 border border-gray-100 p-3">
                            <div className="text-xs font-semibold text-slate-500">Clarity</div>
                            <div className="font-semibold text-slate-900">{r.clarity}/5</div>
                          </div>
                          <div className="rounded-xl bg-slate-50 border border-gray-100 p-3">
                            <div className="text-xs font-semibold text-slate-500">Significance</div>
                            <div className="font-semibold text-slate-900">{r.significance}/5</div>
                          </div>
                          <div className="col-span-2 mt-1 rounded-xl bg-[#3b82f6]/5 border border-[#3b82f6]/20 p-3">
                            <div className="text-xs font-semibold text-slate-700">Average score</div>
                            <div className="text-lg font-bold text-[#3b82f6]">{avg.toFixed(2)} / 5</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Reviewer comments:</span> {r.comments || '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-slate-600">
              No reviews available yet.
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="max-w-3xl bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Verdict</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.verdict}
              onChange={(e) => setForm({ ...form, verdict: e.target.value })}
            >
              <option value="accepted">Accept</option>
              <option value="revision_required">Revision Required</option>
              <option value="rejected">Reject</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Editor Comments</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              placeholder="Provide final decision reasoning."
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#3b82f6] text-white px-5 py-2 font-medium hover:bg-[#2563eb] transition disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Decision'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

