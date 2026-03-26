import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ChevronDown, Check, UserPlus, Users, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AssignReviewer() {
  const { submissionId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [reviewers, setReviewers] = useState([])
  const [reviewerId, setReviewerId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Custom select state
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const loadReviewers = async () => {
      try {
        const res = await api.get('/api/submissions/reviewers')
        setReviewers(res.data)
        if (res.data.length) {
          setReviewerId(String(res.data[0].id))
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load reviewers')
      } finally {
        setLoading(false)
      }
    }
    if (token) loadReviewers()
  }, [token])

  // Click outside to close custom select
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
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await api.post(`/api/submissions/${submissionId}/assign`, {
        reviewer_id: Number(reviewerId)
      })
      setSuccess('Reviewer assigned successfully')
      setTimeout(() => navigate('/editor/dashboard'), 1500)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign reviewer')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedReviewer = reviewers.find((r) => String(r.id) === String(reviewerId))

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 font-sans selection:bg-blue-500/30">
      <Sidebar />
      <main className="md:ml-64 p-6 lg:p-12 transition-all duration-300">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Assign Reviewer</h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2">
                Select a reviewer for <span className="text-blue-400 font-medium">Submission #{submissionId}</span>
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-[#1a1d27] border border-slate-800/60 rounded-2xl p-8 backdrop-blur-xl">
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p>Loading available reviewers...</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" /> Select Reviewer
                    </label>

                    {/* Custom Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200
                          ${isOpen ? 'bg-slate-800 border-blue-500 ring-2 ring-blue-500/20' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'}
                          border focus:outline-none`}
                      >
                        {selectedReviewer ? (
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{selectedReviewer.name}</span>
                            <span className="text-slate-400 text-sm">{selectedReviewer.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Choose a reviewer...</span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                      </button>

                      {/* Dropdown Options */}
                      {isOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1a1d27] border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {reviewers.length === 0 ? (
                              <div className="p-4 text-center text-slate-400 text-sm">No reviewers available</div>
                            ) : (
                              reviewers.map((r) => (
                                <button
                                  type="button"
                                  key={r.id}
                                  onClick={() => {
                                    setReviewerId(String(r.id))
                                    setIsOpen(false)
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/80 transition-colors text-left
                                    ${String(r.id) === String(reviewerId) ? 'bg-blue-500/10' : ''}`}
                                >
                                  <div className="flex flex-col">
                                    <span className={`font-medium ${String(r.id) === String(reviewerId) ? 'text-blue-400' : 'text-slate-200'}`}>
                                      {r.name}
                                    </span>
                                    <span className="text-slate-400 text-sm">{r.email}</span>
                                  </div>
                                  {String(r.id) === String(reviewerId) && <Check className="w-5 h-5 text-blue-500" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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

                  {/* Footer Actions */}
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
                      disabled={!reviewerId || submitting || loading}
                      className="relative flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      <span className="relative flex items-center gap-2">
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
                          </>
                        ) : (
                          <>
                            Assign Reviewer <Check className="w-4 h-4" />
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