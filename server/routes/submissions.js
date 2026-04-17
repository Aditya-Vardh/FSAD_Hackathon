const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const { sendEmail } = require('../utils/mailer')

router.get('/reviewers', auth, async (req, res) => {
  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })

  try {
    const result = await db.query(
      `SELECT id, name, email FROM users WHERE role = $1 ORDER BY name ASC`,
      ['reviewer']
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.get('/mine', auth, async (req, res) => {
  if (req.user.role !== 'author')
    return res.status(403).json({ message: 'Authors only' })

  try {
    const result = await db.query(
      `SELECT
        s.id AS submission_id, s.status, s.submitted_at,
        p.id AS paper_id, p.title, p.abstract, p.keywords, p.file_path, p.status AS paper_status
       FROM submissions s
       JOIN papers p ON p.id = s.paper_id
       WHERE p.author_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })

  try {
    const result = await db.query(
      `SELECT
        s.id AS submission_id, s.submitted_at,
        p.id AS paper_id, p.title, p.status, p.keywords, p.file_path,
        u.id AS author_id, u.name AS author_name,
        rv.reviewer_id, ru.name AS reviewer_name
       FROM submissions s
       JOIN papers p ON s.paper_id = p.id
       JOIN users u ON p.author_id = u.id
       LEFT JOIN reviews rv ON rv.submission_id = s.id
       LEFT JOIN users ru ON rv.reviewer_id = ru.id
       ORDER BY s.submitted_at DESC`
    )

    const formatted = result.rows.map(row => ({
      submission_id: row.submission_id,
      submitted_at: row.submitted_at,
      paper: { id: row.paper_id, title: row.title, status: row.status, keywords: row.keywords, file_path: row.file_path },
      author: { id: row.author_id, name: row.author_name },
      assigned_reviewers: row.reviewer_name ? [{ reviewer_name: row.reviewer_name }] : []
    }))

    res.json(formatted)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.get('/:id/reviews', auth, async (req, res) => {
  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })

  const submissionId = Number(req.params.id)
  if (!submissionId) return res.status(400).json({ message: 'Invalid submission id' })

  try {
    const result = await db.query(
      `SELECT rv.id, rv.submission_id, rv.reviewer_id, u.name AS reviewer_name,
              rv.originality, rv.methodology, rv.clarity, rv.significance,
              rv.recommendation, rv.comments, rv.created_at
       FROM reviews rv
       JOIN users u ON u.id = rv.reviewer_id
       WHERE rv.submission_id = $1
       ORDER BY rv.created_at DESC`,
      [submissionId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.post('/:id/assign', auth, async (req, res) => {
  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })

  const submissionId = Number(req.params.id)
  const reviewerId = Number(req.body.reviewer_id)
  if (!submissionId || !reviewerId) return res.status(400).json({ message: 'Invalid input' })

  try {
    const existing = await db.query(
      `SELECT id FROM reviews WHERE submission_id = $1 AND reviewer_id = $2`,
      [submissionId, reviewerId]
    )
    if (existing.rows.length)
      return res.status(400).json({ message: 'Reviewer already assigned' })

    const review = await db.query(
      `INSERT INTO reviews (submission_id, reviewer_id) VALUES ($1, $2) RETURNING id`,
      [submissionId, reviewerId]
    )

    await db.query(
      `UPDATE submissions SET editor_id = $1, status = 'assigned' WHERE id = $2`,
      [req.user.id, submissionId]
    )

    await db.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, 'A new paper has been assigned to you for review')`,
      [reviewerId]
    )

    const revResult = await db.query('SELECT name, email FROM users WHERE id = $1', [reviewerId])
    if (revResult.rows.length && revResult.rows[0].email) {
      const reviewer = revResult.rows[0]
      await sendEmail({
        to: reviewer.email,
        subject: 'New Paper Assigned for Review',
        text: `Hello ${reviewer.name},\n\nA new paper has been assigned to you for review (Submission ID: #${submissionId}).`,
        html: `<p>Hello <strong>${reviewer.name}</strong>,</p><p>A new paper has been assigned to you for review (Submission ID: #${submissionId}).</p>`
      })
    }

    res.json({ message: 'Reviewer assigned', assignment: { submission_id: submissionId, reviewer_id: reviewerId, review_id: review.rows[0].id } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  const submissionId = Number(req.params.id)
  if (!submissionId) return res.status(400).json({ message: 'Invalid submission id' })

  try {
    const subResult = await db.query(
      'SELECT s.paper_id, p.author_id FROM submissions s JOIN papers p ON p.id = s.paper_id WHERE s.id = $1',
      [submissionId]
    )
    if (!subResult.rows.length) return res.status(404).json({ message: 'Submission not found' })

    const { paper_id: paperId, author_id: paperAuthorId } = subResult.rows[0]

    if (req.user.role !== 'editor' && req.user.id !== paperAuthorId)
      return res.status(403).json({ message: 'Permission denied' })

    await db.query('DELETE FROM reviews WHERE submission_id = $1', [submissionId])
    await db.query('DELETE FROM decisions WHERE paper_id = $1', [paperId])
    await db.query('DELETE FROM revisions WHERE paper_id = $1', [paperId])
    await db.query('DELETE FROM submissions WHERE id = $1', [submissionId])
    await db.query('DELETE FROM papers WHERE id = $1', [paperId])

    res.json({ message: 'Submission deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router