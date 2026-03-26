const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
const auth = require('../middleware/auth')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

router.post('/', auth, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'author')
    return res.status(403).json({ message: 'Authors only' })

  const { title, abstract, keywords } = req.body

  try {
    const [result] = await db.query(
      'INSERT INTO papers (author_id, title, abstract, keywords, file_path, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, abstract, keywords, req.file?.filename, 'submitted']
    )

    await db.query(
      'INSERT INTO submissions (paper_id, status) VALUES (?, ?)',
      [result.insertId, 'pending']
    )

    res.json({ message: 'Paper submitted', paperId: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.get('/mine', auth, async (req, res) => {
  if (req.user.role !== 'author')
    return res.status(403).json({ message: 'Authors only' })

  try {
    const [rows] = await db.query(
      'SELECT * FROM papers WHERE author_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router