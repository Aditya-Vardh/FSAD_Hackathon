const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')


/*
EDITOR
List reviewers for assignment dropdown
*/
router.get('/reviewers', auth, async (req, res) => {

  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })

  try {

    const [rows] = await db.query(
      `SELECT id, name, email
       FROM users
       WHERE role = ?
       ORDER BY name ASC`,
      ['reviewer']
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
AUTHOR
List my submissions
*/
router.get('/mine', auth, async (req, res) => {

  if (req.user.role !== 'author')
    return res.status(403).json({ message: 'Authors only' })

  try {

    const [rows] = await db.query(

      `
      SELECT
        s.id AS submission_id,
        s.status,
        s.submitted_at,

        p.id AS paper_id,
        p.title,
        p.abstract,
        p.keywords,
        p.file_path,
        p.status AS paper_status

      FROM submissions s

      JOIN papers p
        ON p.id = s.paper_id

      WHERE p.author_id = ?

      ORDER BY s.submitted_at DESC
      `,

      [req.user.id]
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
EDITOR
List all submissions
*/
router.get('/', auth, async (req, res) => {

  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })

  try {

    const [rows] = await db.query(

      `
      SELECT

        s.id AS submission_id,
        s.submitted_at,

        p.id AS paper_id,
        p.title,
        p.status,
        p.keywords,
        p.file_path,

        u.id AS author_id,
        u.name AS author_name,

        rv.reviewer_id,
        ru.name AS reviewer_name

      FROM submissions s

      JOIN papers p
        ON s.paper_id = p.id

      JOIN users u
        ON p.author_id = u.id

      LEFT JOIN reviews rv
        ON rv.submission_id = s.id

      LEFT JOIN users ru
        ON rv.reviewer_id = ru.id

      ORDER BY s.submitted_at DESC
      `
    )


    const formatted = rows.map(row => ({

      submission_id: row.submission_id,

      submitted_at: row.submitted_at,


      paper: {
        id: row.paper_id,
        title: row.title,
        status: row.status,
        keywords: row.keywords,
        file_path: row.file_path
      },


      author: {
        id: row.author_id,
        name: row.author_name
      },


      assigned_reviewers:
        row.reviewer_name
          ? [{ reviewer_name: row.reviewer_name }]
          : []

    }))


    res.json(formatted)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Server error',
      error: err.message
    })
  }
})


/*
EDITOR
Get completed reviews for a submission
*/
router.get('/:id/reviews', auth, async (req, res) => {

  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })

  const submissionId = Number(req.params.id)

  if (!submissionId)
    return res.status(400).json({ message: 'Invalid submission id' })


  try {

    const [rows] = await db.query(

      `
      SELECT

        rv.id,
        rv.submission_id,
        rv.reviewer_id,

        u.name AS reviewer_name,

        rv.originality,
        rv.methodology,
        rv.clarity,
        rv.significance,
        rv.recommendation,
        rv.comments,
        rv.created_at

      FROM reviews rv

      JOIN users u
        ON u.id = rv.reviewer_id

      WHERE rv.submission_id = ?

      ORDER BY rv.created_at DESC
      `,

      [submissionId]
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
EDITOR
Assign reviewer
*/
router.post('/:id/assign', auth, async (req, res) => {

  if (req.user.role !== 'editor')
    return res.status(403).json({ message: 'Editors only' })


  const submissionId = Number(req.params.id)
  const reviewerId = Number(req.body.reviewer_id)


  if (!submissionId || !reviewerId)
    return res.status(400).json({ message: 'Invalid input' })


  try {

    const [existing] = await db.query(

      `
      SELECT id
      FROM reviews
      WHERE submission_id = ?
      AND reviewer_id = ?
      `,

      [submissionId, reviewerId]
    )


    if (existing.length)
      return res.status(400).json({
        message: 'Reviewer already assigned'
      })


    const [review] = await db.query(

      `
      INSERT INTO reviews (submission_id, reviewer_id)
      VALUES (?, ?)
      `,

      [submissionId, reviewerId]
    )


    await db.query(

      `
      UPDATE submissions
      SET editor_id = ?, status = 'assigned'
      WHERE id = ?
      `,

      [req.user.id, submissionId]
    )


    // Notify reviewer of new assignment
    await db.query(
      `INSERT INTO notifications (user_id, message)
       VALUES (?, 'A new paper has been assigned to you for review')`,
      [reviewerId]
    )


    res.json({

      message: 'Reviewer assigned',

      assignment: {
        submission_id: submissionId,
        reviewer_id: reviewerId,
        review_id: review.insertId
      }

    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: 'Server error',
      error: err.message
    })
  }
})


module.exports = router