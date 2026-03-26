const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const anonymise = require('../middleware/anonymise')

// Reviewer: get all assigned papers (double-blind)
router.get('/assigned', auth, async (req, res, next) => {
  if (req.user.role !== 'reviewer') return res.status(403).json({ message: 'Reviewers only' })

  try {
    const reviewerId = req.user.id

    const [rows] = await db.query(
      `
      SELECT
        rv.id AS review_id,
        rv.submission_id,
        rv.reviewer_id,
        rv.originality,
        rv.methodology,
        rv.clarity,
        rv.significance,
        rv.recommendation,
        rv.comments,
        rv.submitted_at AS review_submitted_at,
        s.status AS submission_status,
        s.submitted_at,
        p.id AS paper_id,
        p.title,
        p.abstract,
        p.keywords,
        p.file_path,
        p.status AS paper_status,
        u.id AS author_id,
        u.name AS author_name,
        u.email AS author_email
      FROM reviews rv
      JOIN submissions s ON s.id = rv.submission_id
      JOIN papers p ON p.id = s.paper_id
      JOIN users u ON u.id = p.author_id
      WHERE rv.reviewer_id = ?
      ORDER BY s.submitted_at DESC
      `,
      [reviewerId]
    )

    res.locals.payload = rows.map((row) => ({
      submission_id: row.submission_id,
      status: row.submission_status,
      submitted_at: row.submitted_at,
      paper: {
        id: row.paper_id,
        title: row.title,
        abstract: row.abstract,
        keywords: row.keywords,
        file_path: row.file_path,
        status: row.paper_status
      },
      review: {
        review_id: row.review_id,
        originality: row.originality,
        methodology: row.methodology,
        clarity: row.clarity,
        significance: row.significance,
        recommendation: row.recommendation,
        comments: row.comments,
        submitted_at: row.review_submitted_at
      },
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email
      }
    }))

    next()
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}, anonymise, (req, res) => {
  res.json(res.locals.payload)
})

// Reviewer: submit rubric scores/recommendation/comments
router.post('/:submissionId', auth, async (req, res) => {
  if (req.user.role !== 'reviewer') return res.status(403).json({ message: 'Reviewers only' })

  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return res.status(400).json({ message: 'Invalid submission id' })
  }

  const {
    originality,
    methodology,
    clarity,
    significance,
    recommendation,
    comments
  } = req.body

  const rubricFields = { originality, methodology, clarity, significance }
  for (const [k, v] of Object.entries(rubricFields)) {
    if (!Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 5) {
      return res.status(400).json({ message: `${k} must be an integer between 1 and 5` })
    }
  }

  const allowedRecommendations = ['accept', 'minor_revision', 'major_revision', 'reject']
  if (!allowedRecommendations.includes(recommendation)) {
    return res.status(400).json({ message: 'Invalid recommendation' })
  }

  try {
    // Ensure reviewer is assigned to this submission
    const [assignRows] = await db.query(
      'SELECT id FROM reviews WHERE submission_id = ? AND reviewer_id = ?',
      [submissionId, req.user.id]
    )
    if (!assignRows.length) return res.status(404).json({ message: 'Review assignment not found' })

    const reviewId = assignRows[0].id

    const [stageRows] = await db.query(
      `
      SELECT s.status AS submission_status, p.status AS paper_status
      FROM submissions s
      JOIN papers p ON p.id = s.paper_id
      WHERE s.id = ?
      `,
      [submissionId]
    )
    if (!stageRows.length) return res.status(404).json({ message: 'Submission not found' })
    if (stageRows[0].submission_status === 'decided') {
      return res.status(400).json({ message: 'Reviews are closed for this submission' })
    }

    await db.query(
      `
      UPDATE reviews
      SET originality = ?,
          methodology = ?,
          clarity = ?,
          significance = ?,
          recommendation = ?,
          comments = ?,
          submitted_at = NOW()
      WHERE id = ?
      `,
      [
        Number(originality),
        Number(methodology),
        Number(clarity),
        Number(significance),
        recommendation,
        comments ?? null,
        reviewId
      ]
    )

    // Move paper into "under_review" once review feedback starts/continues.
    await db.query(
      `
      UPDATE papers p
      JOIN submissions s ON s.paper_id = p.id
      SET p.status = 'under_review'
      WHERE s.id = ?
      `,
      [submissionId]
    )

    // If all assigned reviewers have submitted a recommendation, mark submission as reviewed.
    const [reviewStats] = await db.query(
      `
      SELECT
        COUNT(*) AS total_reviews,
        SUM(CASE WHEN recommendation IS NOT NULL THEN 1 ELSE 0 END) AS filled_reviews
      FROM reviews
      WHERE submission_id = ?
      `,
      [submissionId]
    )

    const totalReviews = Number(reviewStats?.[0]?.total_reviews ?? 0)
    const filledReviews = Number(reviewStats?.[0]?.filled_reviews ?? 0)

    const newSubmissionStatus = totalReviews > 0 && filledReviews === totalReviews ? 'reviewed' : 'assigned'
    await db.query('UPDATE submissions SET status = ? WHERE id = ?', [newSubmissionStatus, submissionId])

    const [updated] = await db.query(
      'SELECT id, submission_id, reviewer_id, originality, methodology, clarity, significance, recommendation, comments, submitted_at FROM reviews WHERE id = ?',
      [reviewId]
    )

    res.json({ message: 'Review submitted', review: updated[0] })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router

