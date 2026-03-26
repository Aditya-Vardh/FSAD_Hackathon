import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { api } from '../../lib/api'
import PdfDropzone from '../../components/PdfDropzone'

export default function RevisePaper() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const [responseLetter, setResponseLetter] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Please upload the revised PDF.')
      return
    }
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('response_letter', responseLetter)
      data.append('file', file)
      await api.post(`/api/revisions/${submissionId}`, data)
      navigate('/author/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit revision')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Submit Revision</h1>
          <p className="text-sm text-slate-600 mt-1">Upload your revised manuscript and the response letter.</p>
        </div>

        <form onSubmit={onSubmit} className="max-w-3xl bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Response Letter</label>
            <textarea
              rows={8}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={responseLetter}
              onChange={(e) => setResponseLetter(e.target.value)}
              placeholder="Response letter to reviewers/editors"
            />
          </div>

          <PdfDropzone
            label="Revised Manuscript PDF"
            fileName={file?.name}
            onFileSelected={(selected) => setFile(selected)}
          />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-[#3b82f6] text-white px-5 py-2 font-medium hover:bg-[#2563eb] transition"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Revision'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

