const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

// Ensure notifications table exists on startup
;(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         INT AUTO_INCREMENT PRIMARY KEY,
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


/*
GET /api/notifications/:userId
Return all notifications for a user, newest first.
*/
router.get('/:userId', auth, async (req, res) => {

  const userId = Number(req.params.userId)

  if (!userId)
    return res.status(400).json({ message: 'Invalid user id' })

  // Users may only fetch their own notifications
  if (req.user.id !== userId)
    return res.status(403).json({ message: 'Forbidden' })

  try {

    const [rows] = await db.query(
      `
      SELECT id, user_id, message, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    )

    res.json(rows)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Server error',
      error: err.message
    })
  }
})


/*
PUT /api/notifications/read/:id
Mark a single notification as read.
*/
router.put('/read/:id', auth, async (req, res) => {

  const notifId = Number(req.params.id)

  if (!notifId)
    return res.status(400).json({ message: 'Invalid notification id' })

  try {

    // Verify the notification belongs to the requesting user
    const [rows] = await db.query(
      'SELECT id, user_id FROM notifications WHERE id = ?',
      [notifId]
    )

    if (!rows.length)
      return res.status(404).json({ message: 'Notification not found' })

    if (rows[0].user_id !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' })

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [notifId]
    )

    res.json({ message: 'Notification marked as read' })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Server error',
      error: err.message
    })
  }
})


module.exports = router
