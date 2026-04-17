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

router.post('/', auth, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'author')
    return res.status(403).json({ message: 'Authors only' })

  const { title, abstract, keywords } = req.body

  try {
    const result = await db.query(
      'INSERT INTO papers (author_id, title, abstract, keywords, file_path, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [req.user.id, title, abstract, keywords, req.file?.filename, 'submitted']
    )
    const paperId = result.rows[0].id

    await db.query(
      'INSERT INTO submissions (paper_id, status) VALUES ($1, $2)',
      [paperId, 'pending']
    )

    if (req.user.email) {
      await sendEmail({
        to: req.user.email,
        subject: `Submission Confirmation: ${title}`,
        text: `Hello ${req.user.name},\n\nThank you for submitting your paper "${title}".\n\nYour submission ID is: #${paperId}.`,
        html: `<p>Hello <strong>${req.user.name}</strong>,</p><p>Thank you for submitting "<em>${title}</em>".</p><p>Submission ID: <strong>#${paperId}</strong>.</p>`
      })
    }

    res.json({ message: 'Paper submitted', paperId })
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
      'SELECT * FROM papers WHERE author_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router