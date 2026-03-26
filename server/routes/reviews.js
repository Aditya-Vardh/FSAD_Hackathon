const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const anonymise = require('../middleware/anonymise')

// Reviewer: get all assigned papers
router.get('/assigned', auth, async (req, res, next) => {
  if (req.user.role !== 'reviewer')
    return res.status(403).json({ message: 'Reviewers only' })

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
        rv.created_at AS review_created_at,
        s.status AS submission_status,
        s.created_at,
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
      ORDER BY s.created_at DESC
      `,
      [reviewerId]
    )

    res.locals.payload = rows.map((row) => ({
      submission_id: row.submission_id,
      status: row.submission_status,
      created_at: row.created_at,
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
        created_at: row.review_created_at
      },
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email
      }
    }))

    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}, anonymise, (req, res) => {
  res.json(res.locals.payload)
})

// Reviewer submits review
router.post('/:submissionId', auth, async (req, res) => {
  if (req.user.role !== 'reviewer')
    return res.status(403).json({ message: 'Reviewers only' })

  const submissionId = Number(req.params.submissionId)

  if (!Number.isInteger(submissionId) || submissionId <= 0)
    return res.status(400).json({ message: 'Invalid submission id' })

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
    if (!Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 5)
      return res.status(400).json({ message: `${k} must be 1–5` })
  }

  const allowedRecommendations = [
    'accept',
    'minor_revision',
    'major_revision',
    'reject'
  ]

  if (!allowedRecommendations.includes(recommendation))
    return res.status(400).json({ message: 'Invalid recommendation' })

  try {
    const [assignRows] = await db.query(
      'SELECT id FROM reviews WHERE submission_id = ? AND reviewer_id = ?',
      [submissionId, req.user.id]
    )

    if (!assignRows.length)
      return res.status(404).json({ message: 'Assignment not found' })

    const reviewId = assignRows[0].id

    await db.query(
      `
      UPDATE reviews
      SET originality = ?,
          methodology = ?,
          clarity = ?,
          significance = ?,
          recommendation = ?,
          comments = ?,
          created_at = NOW()
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

    await db.query(
      `
      UPDATE papers p
      JOIN submissions s ON s.paper_id = p.id
      SET p.status = 'under_review'
      WHERE s.id = ?
      `,
      [submissionId]
    )

    res.json({ message: 'Review submitted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router