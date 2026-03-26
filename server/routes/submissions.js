const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

// Editor: list reviewers for assignment dropdown
router.get('/reviewers', auth, async (req, res) => {
  if (req.user.role !== 'editor') return res.status(403).json({ message: 'Editors only' })
  try {
    const [rows] = await db.query(
      'SELECT id, name, email FROM users WHERE role = ? ORDER BY name ASC',
      ['reviewer']
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Author: list my submissions with submission id
router.get('/mine', auth, async (req, res) => {
  if (req.user.role !== 'author') return res.status(403).json({ message: 'Authors only' })
  try {
    const [rows] = await db.query(
      `
      SELECT s.id AS submission_id,
             s.status AS submission_status,
             s.submitted_at,
             p.id AS paper_id,
             p.title,
             p.abstract,
             p.keywords,
             p.file_path,
             p.status AS paper_status
      FROM submissions s
      JOIN papers p ON p.id = s.paper_id
      WHERE p.author_id = ?
      ORDER BY s.submitted_at DESC
      `,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Editor: list submissions with author/reviewer context
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'editor') return res.status(403).json({ message: 'Editors only' })
  try {
    const [rows] = await db.query(`
      SELECT s.id AS submission_id,
             s.status,
             s.submitted_at,
             s.editor_id,
             p.id AS paper_id,
             p.title,
             p.abstract,
             p.keywords,
             p.file_path,
             p.status AS paper_status,
             u.id AS author_id,
             u.name AS author_name,
             u.email AS author_email
      FROM submissions s
      JOIN papers p ON s.paper_id = p.id
      JOIN users u ON p.author_id = u.id
      ORDER BY s.submitted_at DESC
    `)

    const submissionIds = rows.map(row => row.submission_id)
    const assignedReviewers = {}

    if (submissionIds.length) {
      const [reviewRows] = await db.query(
        `
          SELECT rv.id, rv.submission_id, rv.reviewer_id, u.name AS reviewer_name
          FROM reviews rv
          JOIN users u ON u.id = rv.reviewer_id
          WHERE rv.submission_id IN (?)
        `,
        [submissionIds]
      )

      reviewRows.forEach(row => {
        if (!assignedReviewers[row.submission_id]) assignedReviewers[row.submission_id] = []
        assignedReviewers[row.submission_id].push({
          review_id: row.id,
          reviewer_id: row.reviewer_id,
          reviewer_name: row.reviewer_name
        })
      })
    }

    const payload = rows.map(row => ({
      submission_id: row.submission_id,
      status: row.status,
      submitted_at: row.submitted_at,
      editor_id: row.editor_id,
      paper: {
        id: row.paper_id,
        title: row.title,
        abstract: row.abstract,
        keywords: row.keywords,
        file_path: row.file_path,
        status: row.paper_status
      },
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email
      },
      assigned_reviewers: assignedReviewers[row.submission_id] || []
    }))

    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Editor: get all completed reviews for one submission
router.get('/:id/reviews', auth, async (req, res) => {
  if (req.user.role !== 'editor') return res.status(403).json({ message: 'Editors only' })
  const submissionId = Number(req.params.id)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return res.status(400).json({ message: 'Invalid submission id' })
  }

  try {
    const [rows] = await db.query(
      `
      SELECT rv.id,
             rv.submission_id,
             rv.reviewer_id,
             u.name AS reviewer_name,
             p.title AS paper_title,
             p.keywords AS paper_keywords,
             p.file_path AS paper_file_path,
             p.status AS paper_status,
             rv.originality,
             rv.methodology,
             rv.clarity,
             rv.significance,
             rv.recommendation,
             rv.comments,
             rv.submitted_at
      FROM reviews rv
      JOIN users u ON u.id = rv.reviewer_id
      JOIN submissions s ON s.id = rv.submission_id
      JOIN papers p ON p.id = s.paper_id
      WHERE rv.submission_id = ?
      ORDER BY rv.submitted_at DESC
      `,
      [submissionId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Editor: assign a reviewer to a submission
router.post('/:id/assign', auth, async (req, res) => {
  if (req.user.role !== 'editor') return res.status(403).json({ message: 'Editors only' })
  const submissionId = Number(req.params.id)
  const reviewerId = Number(req.body.reviewer_id)

  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return res.status(400).json({ message: 'Invalid submission id' })
  }
  if (!Number.isInteger(reviewerId) || reviewerId <= 0) {
    return res.status(400).json({ message: 'Reviewer id is required' })
  }

  try {
    const [submissions] = await db.query(
      'SELECT s.id, p.author_id FROM submissions s JOIN papers p ON p.id = s.paper_id WHERE s.id = ?',
      [submissionId]
    )
    if (!submissions.length) return res.status(404).json({ message: 'Submission not found' })
    if (submissions[0].author_id === reviewerId) {
      return res.status(400).json({ message: 'Author cannot review their own submission' })
    }

    const [reviewers] = await db.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [reviewerId, 'reviewer']
    )
    if (!reviewers.length) return res.status(400).json({ message: 'Reviewer not found' })

    const [existingAssignments] = await db.query(
      'SELECT id FROM reviews WHERE submission_id = ? AND reviewer_id = ?',
      [submissionId, reviewerId]
    )
    if (existingAssignments.length) {
      return res.status(400).json({ message: 'Reviewer already assigned to this submission' })
    }

    const [reviewResult] = await db.query(
      'INSERT INTO reviews (submission_id, reviewer_id) VALUES (?, ?)',
      [submissionId, reviewerId]
    )

    await db.query(
      'UPDATE submissions SET editor_id = ?, status = ? WHERE id = ?',
      [req.user.id, 'assigned', submissionId]
    )

    res.json({
      message: 'Reviewer assigned',
      assignment: {
        submission_id: submissionId,
        reviewer_id: reviewerId,
        review_id: reviewResult.insertId
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router