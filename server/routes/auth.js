const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

const JWT_SECRET = process.env.JWT_SECRET || 'peer_review_jwt_fallback_secret_2024'

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length) {
      return res.status(400).json({ message: 'Email already registered' })
    }
    const hash = await bcrypt.hash(password, 10)
    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [name, email, hash, role]
    )
    res.json({ message: 'Registered successfully' })
  } catch (err) {
    console.error('REGISTER ERROR:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
    if (!result.rows.length) return res.status(400).json({ message: 'User not found' })
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(400).json({ message: 'Wrong password' })
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } })
  } catch (err) {
    console.error('LOGIN ERROR:', err.message, err.stack)
    res.status(500).json({ message: 'Server error', detail: err.message })
  }
})

module.exports = router