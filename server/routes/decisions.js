const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

router.post('/:submissionId', auth, async (req, res) => {
  if (req.user.role !== 'editor') return res.status(403).json({ message: 'Editors only' })

  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return res.status(400).json({ message: 'Invalid submission id' })
  }

  const { verdict, comments, editor_comments } = req.body
  const finalComments = editor_comments ?? comments ?? null

  const allowedVerdicts = ['accepted', 'revision_required', 'rejected']
  if (!allowedVerdicts.includes(verdict)) {
    return res.status(400).json({ message: 'Invalid verdict' })
  }

  try {
    const [submissionRows] = await db.query(
      `
      SELECT s.id, s.editor_id, p.id AS paper_id
      FROM submissions s
      JOIN papers p ON p.id = s.paper_id
      WHERE s.id = ?
      `,
      [submissionId]
    )

    if (!submissionRows.length) return res.status(404).json({ message: 'Submission not found' })

    const submission = submissionRows[0]
    if (submission.editor_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to decide this submission' })
    }

    // Require all assigned reviews to have recommendations.
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

    if (!reviewStats.length || totalReviews === 0) {
      return res.status(400).json({ message: 'No reviews found for this submission' })
    }

    if (filledReviews !== totalReviews) {
      return res.status(400).json({ message: 'All reviews must be submitted before deciding' })
    }

    const [existingDecision] = await db.query(
      'SELECT id FROM decisions WHERE submission_id = ?',
      [submissionId]
    )

    if (existingDecision.length) {
      await db.query(
        `
        UPDATE decisions
        SET editor_id = ?,
            verdict = ?,
            editor_comments = ?,
            decided_at = NOW()
        WHERE submission_id = ?
        `,
        [req.user.id, verdict, finalComments, submissionId]
      )
    } else {
      await db.query(
        `
        INSERT INTO decisions (submission_id, editor_id, verdict, editor_comments)
        VALUES (?, ?, ?, ?)
        `,
        [submissionId, req.user.id, verdict, finalComments]
      )
    }

    const paperStatus = verdict === 'accepted'
      ? 'accepted'
      : (verdict === 'rejected' ? 'rejected' : 'revision')

    await db.query('UPDATE submissions SET status = ? WHERE id = ?', ['decided', submissionId])
    await db.query(
      `
      UPDATE papers p
      JOIN submissions s ON s.paper_id = p.id
      SET p.status = ?
      WHERE s.id = ?
      `,
      [paperStatus, submissionId]
    )

    res.json({ message: 'Decision saved', verdict })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router

