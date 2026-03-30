const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const { sendEmail } = require('../utils/mailer')

router.post('/:submissionId', auth, async (req, res) => {
  if (req.user.role !== 'editor') return res.status(403).json({ message: 'Editors only' })

  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return res.status(400).json({ message: 'Invalid submission id' })
  }

  const { verdict, comments, editor_comments } = req.body
  const finalDecision = verdict ?? editor_comments ?? comments ?? null

  // The DB column is called 'decision', not 'verdict'
  const allowedVerdicts = ['accepted', 'revision_required', 'rejected']
  if (!allowedVerdicts.includes(finalDecision)) {
    return res.status(400).json({ message: 'Invalid verdict. Must be: accepted, revision_required, or rejected' })
  }

  try {
    // Get submission and its linked paper_id
    const [submissionRows] = await db.query(
      `SELECT s.id, s.editor_id, s.paper_id
       FROM submissions s
       WHERE s.id = ?`,
      [submissionId]
    )

    if (!submissionRows.length) return res.status(404).json({ message: 'Submission not found' })

    const submission = submissionRows[0]

    // Require all assigned reviews to have recommendations
    const [reviewStats] = await db.query(
      `SELECT
        COUNT(*) AS total_reviews,
        SUM(CASE WHEN recommendation IS NOT NULL THEN 1 ELSE 0 END) AS filled_reviews
       FROM reviews
       WHERE submission_id = ?`,
      [submissionId]
    )

    const totalReviews = Number(reviewStats?.[0]?.total_reviews ?? 0)
    const filledReviews = Number(reviewStats?.[0]?.filled_reviews ?? 0)

    if (totalReviews === 0) {
      return res.status(400).json({ message: 'No reviews found for this submission' })
    }

    if (filledReviews !== totalReviews) {
      return res.status(400).json({ message: 'All reviews must be submitted before deciding' })
    }

    const paperId = submission.paper_id

    // Check for existing decision (decisions table uses paper_id, not submission_id)
    const [existingDecision] = await db.query(
      'SELECT id FROM decisions WHERE paper_id = ?',
      [paperId]
    )

    if (existingDecision.length) {
      await db.query(
        `UPDATE decisions
         SET editor_id = ?, decision = ?, created_at = NOW()
         WHERE paper_id = ?`,
        [req.user.id, finalDecision, paperId]
      )
    } else {
      await db.query(
        `INSERT INTO decisions (paper_id, editor_id, decision)
         VALUES (?, ?, ?)`,
        [paperId, req.user.id, finalDecision]
      )
    }

    // Map verdict -> paper status
    const paperStatus =
      finalDecision === 'accepted'
        ? 'accepted'
        : finalDecision === 'rejected'
        ? 'rejected'
        : 'revision'

    await db.query('UPDATE submissions SET status = ? WHERE id = ?', ['decided', submissionId])
    await db.query('UPDATE papers SET status = ? WHERE id = ?', [paperStatus, paperId])

    console.log(`[Decision] Submission #${submissionId} verdict: ${finalDecision}. Database updated.`)


    // Notify author that a decision has been made on their paper
    const [paperRows] = await db.query(
      `SELECT p.id, p.title, p.author_id, u.email, u.name
       FROM papers p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = ?`,
      [paperId]
    )

    if (paperRows.length && paperRows[0].author_id) {
      const author = paperRows[0]
      // Database notification
      await db.query(
        `INSERT INTO notifications (user_id, message)
         VALUES (?, ?)`,
        [author.author_id, `Decision has been made on your paper: "${author.title}"`]
      )

      // Email notification (non-blocking)
      if (author.email) {
        const decisionLabel = finalDecision.replace(/_/g, ' ').toUpperCase()
        const emailResult = await sendEmail({
          to: author.email,
          subject: `Decision on your paper: ${author.title}`,
          text: `Hello ${author.name},\n\nA final decision has been made on your paper "${author.title}".\n\nVerdict: ${decisionLabel}\n\nYou can view the full feedback in your Author Dashboard.`,
          html: `<p>Hello <strong>${author.name}</strong>,</p>
                 <p>A final decision has been made on your paper "<em>${author.title}</em>".</p>
                 <p><strong>Verdict: ${decisionLabel}</strong></p>
                 <p>You can view the full feedback in your Author Dashboard.</p>`
        })

        if (emailResult?.messageId) {
          console.log(`[Notification] Decision email sent to author: ${author.email}`)
        } else if (emailResult?.skipped) {
          console.warn(`[Notification] Author email skipped for ${author.email}: ${emailResult.reason}`)
        }
      }
    }


    // NEW: Notify reviewers of the final decision
    const [reviewerRows] = await db.query(
      `SELECT rv.reviewer_id, u.email, u.name, p.title
       FROM reviews rv
       JOIN users u ON u.id = rv.reviewer_id
       JOIN submissions s ON s.id = rv.submission_id
       JOIN papers p ON p.id = s.paper_id
       WHERE s.id = ?`,
      [submissionId]
    )

    for (const rev of reviewerRows) {
      // Database notification
      await db.query(
        `INSERT INTO notifications (user_id, message)
         VALUES (?, ?)`,
        [rev.reviewer_id, `A final decision has been made on the paper you reviewed: "${rev.title}"`]
      )

      // Email notification (non-blocking)
      if (rev.email) {
        const decisionLabel = finalDecision.replace(/_/g, ' ').toUpperCase()
        sendEmail({
          to: rev.email,
          subject: `Final Decision: ${rev.title}`,
          text: `Hello ${rev.name},\n\nA final decision has been made on the paper "${rev.title}" which you reviewed.\n\nVerdict: ${decisionLabel}\n\nThank you for your contribution to the peer review process.`,
          html: `<p>Hello <strong>${rev.name}</strong>,</p>
                 <p>A final decision has been made on the paper "<em>${rev.title}</em>" which you reviewed.</p>
                 <p><strong>Verdict: ${decisionLabel}</strong></p>
                 <p>Thank you for your contribution to the peer review process.</p>`
        }).then(() => console.log(`[Notification] Decision email sent to reviewer: ${rev.email}`))
          .catch(err => console.error(`[Notification] Failed to notify reviewer: ${rev.email}`, err))
      }
    }



    res.json({ message: 'Decision saved', verdict: finalDecision })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// GET decision for a submission
router.get('/:submissionId', auth, async (req, res) => {
  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return res.status(400).json({ message: 'Invalid submission id' })
  }

  try {
    const [rows] = await db.query(
      `SELECT d.id, d.paper_id, d.editor_id, d.decision, d.created_at
       FROM decisions d
       JOIN submissions s ON s.paper_id = d.paper_id
       WHERE s.id = ?`,
      [submissionId]
    )
    if (!rows.length) return res.status(404).json({ message: 'No decision found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
