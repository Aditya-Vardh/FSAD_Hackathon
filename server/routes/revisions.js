const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
const auth = require('../middleware/auth')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({ storage })

// Author: submit revised paper + response letter
router.post('/:submissionId', auth, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'author') return res.status(403).json({ message: 'Authors only' })

  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return res.status(400).json({ message: 'Invalid submission id' })
  }

  const responseLetter = req.body.response_letter ?? req.body.responseLetter ?? null
  if (!req.file) return res.status(400).json({ message: 'Revised PDF file is required' })
  if (!responseLetter || String(responseLetter).trim().length === 0) {
    return res.status(400).json({ message: 'response_letter is required' })
  }

  try {
    // Verify this submission belongs to the author and is currently in "revision" state.
    const [rows] = await db.query(
      `
      SELECT s.id AS submission_id,
             s.status AS submission_status,
             p.id AS paper_id,
             p.status AS paper_status
      FROM submissions s
      JOIN papers p ON p.id = s.paper_id
      WHERE s.id = ?
        AND p.author_id = ?
      `,
      [submissionId, req.user.id]
    )

    if (!rows.length) return res.status(404).json({ message: 'Submission not found' })

    const submission = rows[0]
    if (submission.paper_status !== 'revision') {
      return res.status(400).json({ message: 'Revisions are only allowed when the decision is revision_required' })
    }

    const filePath = req.file.filename
    await db.query(
      `
      INSERT INTO revisions (submission_id, file_path, response_letter)
      VALUES (?, ?, ?)
      `,
      [submissionId, filePath, responseLetter]
    )

    // Replace the paper PDF and move back to under_review.
    await db.query(
      `
      UPDATE papers p
      JOIN submissions s ON s.paper_id = p.id
      SET p.file_path = ?,
          p.status = 'under_review'
      WHERE s.id = ?
      `,
      [filePath, submissionId]
    )

    // Re-open the submission for reviewers.
    await db.query('UPDATE submissions SET status = ? WHERE id = ?', ['assigned', submissionId])

    res.json({ message: 'Revision submitted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router

