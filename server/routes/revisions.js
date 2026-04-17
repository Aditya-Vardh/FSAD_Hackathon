const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
const auth = require('../middleware/auth')
const { sendEmail } = require('../utils/mailer')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({ storage })

router.post('/:submissionId', auth, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'author') return res.status(403).json({ message: 'Authors only' })

  const submissionId = Number(req.params.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0)
    return res.status(400).json({ message: 'Invalid submission id' })

  const responseLetter = req.body.response_letter ?? req.body.responseLetter ?? null
  if (!req.file) return res.status(400).json({ message: 'Revised manuscript file is required' })
  if (!responseLetter || String(responseLetter).trim().length === 0)
    return res.status(400).json({ message: 'response_letter is required' })

  try {
    const result = await db.query(
      `SELECT s.id AS submission_id, s.status AS submission_status, p.id AS paper_id, p.status AS paper_status
       FROM submissions s
       JOIN papers p ON p.id = s.paper_id
       WHERE s.id = $1 AND p.author_id = $2`,
      [submissionId, req.user.id]
    )

    if (!result.rows.length) return res.status(404).json({ message: 'Submission not found' })

    const submission = result.rows[0]
    if (submission.paper_status !== 'revision')
      return res.status(400).json({ message: 'Revisions are only allowed when the decision is revision_required' })

    const filePath = req.file.filename

    await db.query(
      `INSERT INTO revisions (submission_id, file_path, response_letter) VALUES ($1, $2, $3)`,
      [submissionId, filePath, responseLetter]
    )

    await db.query(
      `UPDATE papers SET file_path = $1, status = 'under_review'
       WHERE id = (SELECT paper_id FROM submissions WHERE id = $2)`,
      [filePath, submissionId]
    )

    await db.query('UPDATE submissions SET status = $1 WHERE id = $2', ['assigned', submissionId])

    const subResult = await db.query(
      `SELECT s.id, s.editor_id, u.email, u.name, p.title
       FROM submissions s
       JOIN users u ON u.id = s.editor_id
       JOIN papers p ON p.id = s.paper_id
       WHERE s.id = $1`,
      [submissionId]
    )

    if (subResult.rows.length && subResult.rows[0].editor_id) {
      const editor = subResult.rows[0]
      await db.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
        [editor.editor_id, `A revision has been submitted for "${editor.title}"`]
      )
      if (editor.email) {
        await sendEmail({
          to: editor.email,
          subject: 'Revision Submitted',
          text: `Hello ${editor.name},\n\nA revised manuscript was submitted for "${editor.title}" (ID: #${submissionId}).`,
          html: `<p>Hello <strong>${editor.name}</strong>,</p><p>A revised manuscript was submitted for "<em>${editor.title}</em>" (ID: #${submissionId}).</p>`
        })
      }
    }

    res.json({ message: 'Revision submitted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router