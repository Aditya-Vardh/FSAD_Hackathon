const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const anonymise = require('../middleware/anonymise')
const { sendEmail } = require('../utils/mailer')

router.get('/assigned', auth, async (req, res, next) => {
  if (req.user.role !== 'reviewer')
    return res.status(403).json({ message: 'Reviewers only' })

  try {
    const result = await db.query(
      `SELECT
        rv.id AS review_id, rv.submission_id, rv.reviewer_id,
        rv.originality, rv.methodology, rv.clarity, rv.significance,
        rv.recommendation, rv.comments, rv.created_at AS review_created_at,
        s.status AS submission_status, s.created_at,
        p.id AS paper_id, p.title, p.abstract, p.keywords, p.file_path, p.status AS paper_status,
        u.id AS author_id, u.name AS author_name, u.email AS author_email
       FROM reviews rv
       JOIN submissions s ON s.id = rv.submission_id
       JOIN papers p ON p.id = s.paper_id
       JOIN users u ON u.id = p.author_id
       WHERE rv.reviewer_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    )

    res.locals.payload = result.rows.map((row) => ({
      submission_id: row.submission_id,
      status: row.submission_status,
      created_at: row.created_at,
      paper: { id: row.paper_id, title: row.title, abstract: row.abstract, keywords: row.keywords, file_path: row.file_path, status: row.paper_status },
      review: { review_id: row.review_id, originality: row.originality, methodology: row.methodology, clarity: row.clarity, significance: row.significance, recommendation: row.recommendation, comments: row.comments, created_at: row.review_created_at },
      author: { id: row.author_id, name: row.author_name, email: row.author_email }
    }))

    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}, anonymise, (req, res) => {
  res.json(res.locals.payload)
})

router.post('/:submissionId', auth, async (req, res) => {
  if (req.user.role !== 'reviewer')
    return res.status(403).json({ message: 'Reviewers only' })

  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0)
    return res.status(400).json({ message: 'Invalid submission id' })

  const { originality, methodology, clarity, significance, recommendation, comments } = req.body
  const rubricFields = { originality, methodology, clarity, significance }

  for (const [k, v] of Object.entries(rubricFields)) {
    if (!Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 5)
      return res.status(400).json({ message: `${k} must be 1–5` })
  }

  const allowedRecommendations = ['accept', 'minor_revision', 'major_revision', 'reject']
  if (!allowedRecommendations.includes(recommendation))
    return res.status(400).json({ message: 'Invalid recommendation' })

  try {
    const assignResult = await db.query(
      'SELECT id FROM reviews WHERE submission_id = $1 AND reviewer_id = $2',
      [submissionId, req.user.id]
    )
    if (!assignResult.rows.length)
      return res.status(404).json({ message: 'Assignment not found' })

    const reviewId = assignResult.rows[0].id

    await db.query(
      `UPDATE reviews
       SET originality = $1, methodology = $2, clarity = $3, significance = $4,
           recommendation = $5, comments = $6, created_at = NOW()
       WHERE id = $7`,
      [Number(originality), Number(methodology), Number(clarity), Number(significance), recommendation, comments ?? null, reviewId]
    )

    await db.query(
      `UPDATE papers SET status = 'under_review'
       WHERE id = (SELECT paper_id FROM submissions WHERE id = $1)`,
      [submissionId]
    )

    const submResult = await db.query(
      `SELECT s.id, s.editor_id, u.email, u.name, p.title
       FROM submissions s
       JOIN users u ON u.id = s.editor_id
       JOIN papers p ON p.id = s.paper_id
       WHERE s.id = $1`,
      [submissionId]
    )

    if (submResult.rows.length && submResult.rows[0].editor_id) {
      const editor = submResult.rows[0]
      await db.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
        [editor.editor_id, `A reviewer submitted feedback for "${editor.title}"`]
      )
      if (editor.email) {
        await sendEmail({
          to: editor.email,
          subject: 'Review Feedback Submitted',
          text: `Hello ${editor.name},\n\nA reviewer has submitted feedback for "${editor.title}" (ID: #${submissionId}).`,
          html: `<p>Hello <strong>${editor.name}</strong>,</p><p>A reviewer submitted feedback for "<em>${editor.title}</em>" (ID: #${submissionId}).</p>`
        })
      }
    }

    res.json({ message: 'Review submitted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router