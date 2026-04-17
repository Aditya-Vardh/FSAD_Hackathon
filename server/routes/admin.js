const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

router.get('/analytics', auth, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admins only' })

  try {
    const totalResult = await db.query(
      `SELECT COUNT(*) AS total_submissions FROM papers WHERE status <> 'draft'`
    )

    const metricResult = await db.query(
      `SELECT
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN status IN ('submitted','under_review','revision') THEN 1 ELSE 0 END) AS pending_count
       FROM papers WHERE status <> 'draft'`
    )

    const acceptedCount = Number(metricResult.rows[0]?.accepted_count ?? 0)
    const rejectedCount = Number(metricResult.rows[0]?.rejected_count ?? 0)
    const pendingCount = Number(metricResult.rows[0]?.pending_count ?? 0)

    const accResult = await db.query(
      `SELECT
        SUM(CASE WHEN decision = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
        COUNT(*) AS total_decisions
       FROM decisions`
    )

    const totalDecisions = Number(accResult.rows[0]?.total_decisions ?? 0)
    const acceptanceRate = totalDecisions === 0
      ? 0
      : (Number(accResult.rows[0]?.accepted_count ?? 0) / totalDecisions) * 100

    const turnResult = await db.query(
      `SELECT EXTRACT(EPOCH FROM AVG(d.created_at - s.created_at)) AS avg_seconds
       FROM decisions d
       JOIN papers p ON p.id = d.paper_id
       JOIN submissions s ON s.paper_id = p.id`
    )

    const avgSeconds = Number(turnResult.rows[0]?.avg_seconds ?? 0)
    const avgTurnaroundTimeHours = avgSeconds === 0 ? 0 : avgSeconds / 3600

    const statusOrder = ['submitted', 'under_review', 'accepted', 'rejected', 'revision']
    const initialCounts = Object.fromEntries(statusOrder.map((s) => [s, 0]))

    const byStatusResult = await db.query(
      `SELECT status, COUNT(*) AS count FROM papers
       WHERE status IN ('submitted','under_review','accepted','rejected','revision')
       GROUP BY status`
    )

    byStatusResult.rows.forEach((r) => {
      if (initialCounts.hasOwnProperty(r.status)) {
        initialCounts[r.status] = Number(r.count)
      }
    })

    const submissionsByStatusArray = statusOrder.map((status) => ({
      status,
      count: initialCounts[status]
    }))

    const recentResult = await db.query(
      `SELECT p.title, u.name AS author_name, p.status AS paper_status, s.created_at
       FROM submissions s
       JOIN papers p ON p.id = s.paper_id
       JOIN users u ON u.id = p.author_id
       ORDER BY s.created_at DESC
       LIMIT 10`
    )

    res.json({
      totalSubmissions: Number(totalResult.rows[0]?.total_submissions ?? 0),
      acceptedCount,
      rejectedCount,
      pendingCount,
      acceptanceRate: Number(acceptanceRate.toFixed(2)),
      avgTurnaroundTimeHours: Number(avgTurnaroundTimeHours.toFixed(2)),
      submissionsByStatus: initialCounts,
      submissionsByStatusArray,
      recentSubmissions: recentResult.rows.map((r) => ({
        title: r.title,
        author: r.author_name,
        status: r.paper_status,
        submitted_at: r.created_at
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router