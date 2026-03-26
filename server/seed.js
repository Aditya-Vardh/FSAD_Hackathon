const fs = require('fs')
const path = require('path')
require('dotenv').config()

const db = require('./db')

const UPLOAD_DIR = path.join(__dirname, 'uploads')

function ensureUploads() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

function escapePdfText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function makePdfBytes(label) {
  // Standards-compliant minimal PDF with xref table so browsers/PDF viewers load it.
  // This is intentionally tiny but valid for demo purposes.
  const text = escapePdfText(label || 'Peer Review')
  const fontSize = 22
  const contentStream = `BT /F1 ${fontSize} Tf 20 95 Td (${text}) Tj ET\n`
  const contentBytes = Buffer.from(contentStream, 'latin1')

  const objects = [
    // 1: Catalog
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    // 2: Pages
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    // 3: Page
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144]\n/Resources << /Font << /F1 5 0 R >> >>\n/Contents 4 0 R >>\nendobj\n',
    // 4: Contents stream
    `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}endstream\nendobj\n`,
    // 5: Font
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ]

  const header = `%PDF-1.4\n% PeerReviewSeed\n`
  const buffers = [Buffer.from(header, 'latin1')]

  const offsets = []
  let cursor = buffers[0].length

  // Record offsets (object numbers start at 1, so offsets array is aligned for objects[] index+1)
  objects.forEach((obj) => {
    offsets.push(cursor)
    const b = Buffer.from(obj, 'latin1')
    buffers.push(b)
    cursor += b.length
  })

  const xrefOffset = cursor
  const objCount = objects.length + 1 // including object 0

  const xrefLines = []
  xrefLines.push('xref\n')
  xrefLines.push(`0 ${objCount}\n`)
  xrefLines.push('0000000000 65535 f \n')

  // offsets corresponds to object 1..N
  for (let i = 0; i < offsets.length; i++) {
    const off = offsets[i]
    xrefLines.push(`${String(off).padStart(10, '0')} 00000 n \n`)
  }

  const trailer = `trailer\n<< /Size ${objCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  buffers.push(Buffer.from(xrefLines.join('') + trailer, 'latin1'))

  return Buffer.concat(buffers)
}

function writePdf(filename, label) {
  ensureUploads()
  const full = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(full, makePdfBytes(label))
  return filename
}

async function seed() {
  ensureUploads()

  // Demo accounts
  const users = [
    { name: 'Admin', email: 'admin@test.com', role: 'admin', password: 'password123' },
    { name: 'Author 1', email: 'author1@test.com', role: 'author', password: 'password123' },
    { name: 'Author 2', email: 'author2@test.com', role: 'author', password: 'password123' },
    { name: 'Reviewer 1', email: 'reviewer1@test.com', role: 'reviewer', password: 'password123' },
    { name: 'Reviewer 2', email: 'reviewer2@test.com', role: 'reviewer', password: 'password123' },
    { name: 'Editor', email: 'editor@test.com', role: 'editor', password: 'password123' }
  ]

  // Use bcryptjs like auth route does.
  const bcrypt = require('bcryptjs')

  const emailToUser = new Map(users.map((u) => [u.email, u]))

  await db.query('START TRANSACTION')

  try {
    // Hackathon demo seed: wipe existing workflow data so "View PDF" never points
    // at old dummy/invalid PDFs created by earlier tests.
    await db.query('SET FOREIGN_KEY_CHECKS=0')
    await db.query('DELETE FROM decisions')
    await db.query('DELETE FROM revisions')
    await db.query('DELETE FROM reviews')
    await db.query('DELETE FROM submissions')
    await db.query('DELETE FROM papers')
    await db.query('DELETE FROM users')
    await db.query('SET FOREIGN_KEY_CHECKS=1')

    // Insert users
    const insertedUsers = {}
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10)
      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [u.name, u.email, hash, u.role]
      )
      insertedUsers[u.email] = result.insertId
    }

    // Sample PDFs
    const pdfSubmitted = writePdf('seed-submitted.pdf', 'seed-submitted')
    const pdfUnderReview = writePdf('seed-under_review.pdf', 'seed-under_review')
    const pdfAccepted = writePdf('seed-accepted.pdf', 'seed-accepted')
    const pdfRevision = writePdf('seed-revision.pdf', 'seed-revision')

    // Create 3 papers + submissions with different statuses.
    // 1) submitted
    const [p1] = await db.query(
      'INSERT INTO papers (author_id, title, abstract, keywords, file_path, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        insertedUsers['author1@test.com'],
        'Submitted Paper: A Minimal Study',
        'A short abstract for the submitted-paper demo.',
        'AI, Systems',
        pdfSubmitted,
        'submitted'
      ]
    )
    await db.query(
      'INSERT INTO submissions (paper_id, status) VALUES (?, ?)',
      [p1.insertId, 'pending']
    )

    // 2) under_review
    const [p2] = await db.query(
      'INSERT INTO papers (author_id, title, abstract, keywords, file_path, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        insertedUsers['author2@test.com'],
        'Under Review Paper: Methods & Evaluation',
        'A short abstract for the under-review demo.',
        'NLP, Evaluation',
        pdfUnderReview,
        'under_review'
      ]
    )
    const [s2] = await db.query('INSERT INTO submissions (paper_id, status) VALUES (?, ?)', [p2.insertId, 'assigned'])

    // Seed one review row without recommendation (so still in progress).
    const [rev2] = await db.query(
      'INSERT INTO reviews (submission_id, reviewer_id) VALUES (?, ?)',
      [s2.insertId, insertedUsers['reviewer1@test.com']]
    )

    // Leave rev2 rubrics as NULL.
    void rev2

    // 3) accepted (with sample reviews/decision)
    const [p3] = await db.query(
      'INSERT INTO papers (author_id, title, abstract, keywords, file_path, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        insertedUsers['author1@test.com'],
        'Accepted Paper: Robust Peer Review Pipelines',
        'A short abstract for the accepted-paper demo.',
        'Peer Review, Frameworks',
        pdfAccepted,
        'accepted'
      ]
    )
    const [s3] = await db.query('INSERT INTO submissions (paper_id, editor_id, status) VALUES (?, ?, ?)', [
      p3.insertId,
      insertedUsers['editor@test.com'],
      'decided'
    ])

    // Seed sample reviews
    const [r1] = await db.query(
      'INSERT INTO reviews (submission_id, reviewer_id, originality, methodology, clarity, significance, recommendation, comments, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [s3.insertId, insertedUsers['reviewer1@test.com'], 5, 4, 4, 5, 'accept', 'Strong work.' ]
    )
    const [r2] = await db.query(
      'INSERT INTO reviews (submission_id, reviewer_id, originality, methodology, clarity, significance, recommendation, comments, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [s3.insertId, insertedUsers['reviewer2@test.com'], 4, 4, 5, 4, 'minor_revision', 'Good, but minor tweaks.' ]
    )
    void r1
    void r2

    // Seed decision: accepted
    await db.query(
      `
      INSERT INTO decisions (submission_id, editor_id, verdict, editor_comments, decided_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [
        s3.insertId,
        insertedUsers['editor@test.com'],
        'accepted',
        'Accepted based on reviewers’ recommendations.'
      ]
    )

    // Seed one revision entry (not required for accepted, but helps show the flow).
    await db.query(
      'INSERT INTO revisions (submission_id, file_path, response_letter) VALUES (?, ?, ?)',
      [s3.insertId, pdfRevision, 'Response letter for the demo revision.']
    )

    await db.query('COMMIT')
    console.log('Seed complete')
  } catch (err) {
    await db.query('ROLLBACK')
    console.error('Seed failed:', err)
    process.exit(1)
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

