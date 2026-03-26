import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function AssignReviewer() {
  const { submissionId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [reviewers, setReviewers] = useState([])
  const [reviewerId, setReviewerId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/submissions/reviewers')
        setReviewers(res.data)
        if (res.data.length) setReviewerId(String(res.data[0].id))
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load reviewers')
      }
    }
    load()
  }, [token])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await api.post(`/api/submissions/${submissionId}/assign`, { reviewer_id: Number(reviewerId) })
      setSuccess('Reviewer assigned successfully')
      setTimeout(() => navigate('/editor/dashboard'), 600)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign reviewer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Assign Reviewer</h1>
          <p className="text-sm text-slate-600 mt-1">Choose a reviewer for the selected submission.</p>
        </div>

        <form onSubmit={onSubmit} className="max-w-xl bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div>
            <div className="text-sm text-slate-600">Submission #{submissionId}</div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">Reviewer</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
            >
              {reviewers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </div>

        {success ? <p className="text-sm text-green-700 font-medium">{success}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-[#3b82f6] text-white px-5 py-2 font-medium hover:bg-[#2563eb] transition disabled:opacity-60"
              disabled={!reviewerId || submitting}
            >
              {submitting ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

