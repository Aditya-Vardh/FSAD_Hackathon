import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import RubricSlider from '../../components/RubricSlider'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'

export default function ReviewForm() {
  const { submissionId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    originality: 3,
    methodology: 3,
    clarity: 3,
    significance: 3,
    recommendation: 'accept',
    comments: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/reviews/assigned')
        const match = res.data.find((r) => String(r.submission_id) === String(submissionId))
        if (!match) {
          setError('Submission not assigned to you')
          return
        }
        setPaper(match)
        if (match.review.recommendation) {
          setForm({
            originality: match.review.originality ?? 3,
            methodology: match.review.methodology ?? 3,
            clarity: match.review.clarity ?? 3,
            significance: match.review.significance ?? 3,
            recommendation: match.review.recommendation,
            comments: match.review.comments || ''
          })
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load submission')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, submissionId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await api.post(`/api/reviews/${submissionId}`, form)
      setSuccess('Review submitted successfully')
      navigate('/reviewer/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Reviewer Evaluation</h1>
          <p className="text-sm text-slate-600 mt-1">Rubric scores and recommendation (double-blind).</p>
        </div>

        {success ? <p className="text-green-700 mb-3 font-medium">{success}</p> : null}
        {error ? <p className="text-red-700 mb-3">{error}</p> : null}
        {loading ? (
          <div className="py-8">
            <Spinner label="Loading review..." />
          </div>
        ) : null}

        {paper ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-slate-500">Submission #{submissionId}</div>
                <h2 className="text-lg font-semibold text-slate-900 mt-1">{paper.paper.title}</h2>
                <div className="text-sm text-slate-600 mt-1">Keywords: {paper.paper.keywords || '—'}</div>
              </div>
              <div className="flex items-center">
                <a
                  href={`http://localhost:5000/uploads/${paper.paper.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#3b82f6] text-white px-4 py-2 text-sm font-medium hover:bg-[#2563eb] transition"
                >
                  Open PDF
                </a>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="max-w-3xl bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="space-y-4">
            <RubricSlider label="Originality" value={form.originality} onChange={(v) => setForm({ ...form, originality: v })} />
            <RubricSlider label="Methodology" value={form.methodology} onChange={(v) => setForm({ ...form, methodology: v })} />
            <RubricSlider label="Clarity" value={form.clarity} onChange={(v) => setForm({ ...form, clarity: v })} />
            <RubricSlider label="Significance" value={form.significance} onChange={(v) => setForm({ ...form, significance: v })} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Recommendation</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.recommendation}
              onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
            >
              <option value="accept">Accept</option>
              <option value="minor_revision">Minor Revision</option>
              <option value="major_revision">Major Revision</option>
              <option value="reject">Reject</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Comments</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={7}
              placeholder="Provide rubric-specific justification for your scores."
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-[#3b82f6] text-white px-5 py-2 font-medium hover:bg-[#2563eb] transition"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

