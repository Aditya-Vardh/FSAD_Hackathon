const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

;(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INT NOT NULL,
        message    TEXT NOT NULL,
        is_read    BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (err) {
    console.error('Failed to create notifications table:', err.message)
  }
})()

router.get('/:userId', auth, async (req, res) => {
  const userId = Number(req.params.userId)
  if (!userId) return res.status(400).json({ message: 'Invalid user id' })
  if (req.user.id !== userId) return res.status(403).json({ message: 'Forbidden' })

  try {
    const result = await db.query(
      `SELECT id, user_id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.put('/read/:id', auth, async (req, res) => {
  const notifId = Number(req.params.id)
  if (!notifId) return res.status(400).json({ message: 'Invalid notification id' })

  try {
    const result = await db.query(
      'SELECT id, user_id FROM notifications WHERE id = $1',
      [notifId]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Notification not found' })
    if (result.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' })

    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [notifId])
    res.json({ message: 'Notification marked as read' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router