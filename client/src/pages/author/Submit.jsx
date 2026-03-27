import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { api } from '../../lib/api'
import PdfDropzone from '../../components/PdfDropzone'

export default function SubmitPaper() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', abstract: '', keywords: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Please upload a manuscript file.')
      return
    }
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', form.title)
      data.append('abstract', form.abstract)
      data.append('keywords', form.keywords)
      data.append('file', file)
      await api.post('/api/papers', data)
      navigate('/author/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit paper')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-blue-900">Submit Paper</h1>
          <p className="text-sm text-slate-600 mt-1">Upload your manuscript (PDF, DOCX, PPT) and provide the required metadata.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="max-w-3xl bg-white border border-gray-100 rounded-2xl p-6 md:p-7 shadow-sm space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Title</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paper title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Abstract</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder="Abstract"
              required
              value={form.abstract}
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Keywords</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Comma-separated keywords"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <PdfDropzone
              label="Manuscript File"
              fileName={file?.name}
              onFileSelected={(selected) => setFile(selected)}
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="rounded-xl bg-[#3b82f6] text-white px-5 py-2 font-medium hover:bg-[#2563eb] transition"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

