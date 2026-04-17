const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const { sendEmail } = require('../utils/mailer')

router.post('/:submissionId', auth, async (req, res) => {
  if (req.user.role !== 'editor') return res.status(403).json({ message: 'Editors only' })

  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0)
    return res.status(400).json({ message: 'Invalid submission id' })

  const { verdict, comments, editor_comments } = req.body
  const finalDecision = verdict ?? editor_comments ?? comments ?? null

  const allowedVerdicts = ['accepted', 'revision_required', 'rejected']
  if (!allowedVerdicts.includes(finalDecision))
    return res.status(400).json({ message: 'Invalid verdict. Must be: accepted, revision_required, or rejected' })

  try {
    const submResult = await db.query(
      `SELECT s.id, s.editor_id, s.paper_id FROM submissions s WHERE s.id = $1`,
      [submissionId]
    )
    if (!submResult.rows.length) return res.status(404).json({ message: 'Submission not found' })

    const submission = submResult.rows[0]

    const reviewStats = await db.query(
      `SELECT COUNT(*) AS total_reviews,
              SUM(CASE WHEN recommendation IS NOT NULL THEN 1 ELSE 0 END) AS filled_reviews
       FROM reviews WHERE submission_id = $1`,
      [submissionId]
    )

    const totalReviews = Number(reviewStats.rows[0]?.total_reviews ?? 0)
    const filledReviews = Number(reviewStats.rows[0]?.filled_reviews ?? 0)

    if (totalReviews === 0)
      return res.status(400).json({ message: 'No reviews found for this submission' })
    if (filledReviews !== totalReviews)
      return res.status(400).json({ message: 'All reviews must be submitted before deciding' })

    const paperId = submission.paper_id

    const existingDecision = await db.query(
      'SELECT id FROM decisions WHERE paper_id = $1', [paperId]
    )

    if (existingDecision.rows.length) {
      await db.query(
        `UPDATE decisions SET editor_id = $1, decision = $2, created_at = NOW() WHERE paper_id = $3`,
        [req.user.id, finalDecision, paperId]
      )
    } else {
      await db.query(
        `INSERT INTO decisions (paper_id, editor_id, decision) VALUES ($1, $2, $3)`,
        [paperId, req.user.id, finalDecision]
      )
    }

    const paperStatus = finalDecision === 'accepted' ? 'accepted' : finalDecision === 'rejected' ? 'rejected' : 'revision'

    await db.query('UPDATE submissions SET status = $1 WHERE id = $2', ['decided', submissionId])
    await db.query('UPDATE papers SET status = $1 WHERE id = $2', [paperStatus, paperId])

    const paperResult = await db.query(
      `SELECT p.id, p.title, p.author_id, u.email, u.name
       FROM papers p JOIN users u ON u.id = p.author_id WHERE p.id = $1`,
      [paperId]
    )

    if (paperResult.rows.length) {
      const author = paperResult.rows[0]
      await db.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
        [author.author_id, `Decision has been made on your paper: "${author.title}"`]
      )
      if (author.email) {
        const decisionLabel = finalDecision.replace(/_/g, ' ').toUpperCase()
        await sendEmail({
          to: author.email,
          subject: `Decision on your paper: ${author.title}`,
          text: `Hello ${author.name},\n\nVerdict: ${decisionLabel} on "${author.title}".`,
          html: `<p>Hello <strong>${author.name}</strong>,</p><p>Verdict: <strong>${decisionLabel}</strong> on "<em>${author.title}</em>".</p>`
        })
      }
    }

    const reviewerResult = await db.query(
      `SELECT rv.reviewer_id, u.email, u.name, p.title
       FROM reviews rv
       JOIN users u ON u.id = rv.reviewer_id
       JOIN submissions s ON s.id = rv.submission_id
       JOIN papers p ON p.id = s.paper_id
       WHERE s.id = $1`,
      [submissionId]
    )

    for (const rev of reviewerResult.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
        [rev.reviewer_id, `A final decision has been made on the paper you reviewed: "${rev.title}"`]
      )
      if (rev.email) {
        const decisionLabel = finalDecision.replace(/_/g, ' ').toUpperCase()
        sendEmail({
          to: rev.email,
          subject: `Final Decision: ${rev.title}`,
          text: `Hello ${rev.name},\n\nVerdict: ${decisionLabel} on "${rev.title}". Thank you for your contribution.`,
          html: `<p>Hello <strong>${rev.name}</strong>,</p><p>Verdict: <strong>${decisionLabel}</strong> on "<em>${rev.title}</em>".</p>`
        }).catch(err => console.error(`Failed to notify reviewer: ${rev.email}`, err))
      }
    }

    res.json({ message: 'Decision saved', verdict: finalDecision })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.get('/:submissionId', auth, async (req, res) => {
  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0)
    return res.status(400).json({ message: 'Invalid submission id' })

  try {
    const result = await db.query(
      `SELECT d.id, d.paper_id, d.editor_id, d.decision, d.created_at
       FROM decisions d
       JOIN submissions s ON s.paper_id = d.paper_id
       WHERE s.id = $1`,
      [submissionId]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'No decision found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router