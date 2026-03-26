import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ExternalLink, Gavel, Loader2, AlertCircle, CheckCircle2, XCircle, FileEdit, MessageSquare, ChevronDown, Check } from 'lucide-react'

const VERDICTS = [
  { value: 'accepted', label: 'Accept', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { value: 'revision', label: 'Revision', icon: FileEdit, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { value: 'rejected', label: 'Reject', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' }
]

export default function DecideSubmission() {
  const { submissionId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    verdict: 'accepted',
    comments: ''
  })

  // Custom select state
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/submissions/${submissionId}/reviews`)
        setReviews(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load reviews')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [submissionId, token])

  // Click outside to close standard selection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post(`/api/decisions/${submissionId}`, form)
      setSuccess('Final decision saved successfully')
      setTimeout(() => navigate('/editor/dashboard'), 1500)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save decision')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedVerdict = VERDICTS.find(v => v.value === form.verdict)
  const SelectedIcon = selectedVerdict?.icon || CheckCircle2

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <main className="md:ml-64 p-6 lg:p-12 transition-all duration-300">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Gavel className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Final Decision</h1>
                <p className="text-slate-400 mt-1 flex items-center gap-2">
                  Paper <span className="text-indigo-400 font-medium">#{submissionId}</span>
                </p>
              </div>
            </div>

            {reviews.length > 0 && (
              <a
                href={`http://localhost:10000/uploads/${reviews[0].paper_file_path}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-slate-700"
              >
                <ExternalLink className="w-4 h-4" /> View Paper PDF
              </a>
            )}
          </div>

          {/* Form Card */}
          <div className="relative group mt-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-[#1a1d27] border border-slate-800/60 rounded-2xl p-8 backdrop-blur-xl">
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p>Loading submission data...</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-6">
                  
                  {/* Verdict Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                      <Gavel className="w-4 h-4 text-slate-400" /> Verdict
                    </label>

                    {/* Custom Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200
                          ${isOpen ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'}
                          border focus:outline-none`}
                      >
                        {selectedVerdict ? (
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selectedVerdict.bg} ${selectedVerdict.color}`}>
                              <SelectedIcon className="w-5 h-5" />
                            </div>
                            <span className="text-white font-medium text-lg">{selectedVerdict.label}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Select a verdict...</span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                      </button>

                      {/* Dropdown Options */}
                      {isOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1a1d27] border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          {VERDICTS.map((v) => {
                            const Icon = v.icon;
                            const isSelected = form.verdict === v.value;
                            return (
                              <button
                                type="button"
                                key={v.value}
                                onClick={() => {
                                  setForm({ ...form, verdict: v.value })
                                  setIsOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/80 transition-colors text-left
                                  ${isSelected ? 'bg-indigo-500/10' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg ${v.bg} ${v.color}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className={`font-medium ${isSelected ? 'text-indigo-400' : 'text-slate-200'}`}>
                                    {v.label}
                                  </span>
                                </div>
                                {isSelected && <Check className="w-5 h-5 text-indigo-500" />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments Textarea */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" /> Editor Comments <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Provide constructive feedback for the authors..."
                      value={form.comments}
                      onChange={(e) => setForm({ ...form, comments: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-slate-200 placeholder:text-slate-600 resize-y"
                    />
                  </div>

                  {/* Status Messages */}
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{success}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => navigate('/editor/dashboard')}
                      className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || loading}
                      className="relative flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)]"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      <span className="relative flex items-center gap-2">
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            Publish Decision <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}