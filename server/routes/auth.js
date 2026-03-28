const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) {
      return res.status(400).json({ message: 'Email already registered' })
    }


    const hash = await bcrypt.hash(password, 10)
    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    )

    res.json({ message: 'Registered successfully' })
  } catch (err) {
    console.error('REGISTER ERROR:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
    if (!rows.length) return res.status(400).json({ message: 'User not found' })
    const valid = await bcrypt.compare(password, rows[0].password_hash)
    if (!valid) return res.status(400).json({ message: 'Wrong password' })
    const token = jwt.sign(
      { id: rows[0].id, role: rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: rows[0].id, name: rows[0].name, role: rows[0].role } })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router