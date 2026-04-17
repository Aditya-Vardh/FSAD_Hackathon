const db = require('./db')

async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      email         VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          VARCHAR(50)  NOT NULL DEFAULT 'author'
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS papers (
      id         SERIAL PRIMARY KEY,
      author_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      VARCHAR(255) NOT NULL,
      abstract   TEXT,
      keywords   TEXT,
      file_path  TEXT,
      status     VARCHAR(50) NOT NULL DEFAULT 'submitted',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id           SERIAL PRIMARY KEY,
      paper_id     INT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      status       VARCHAR(50) NOT NULL DEFAULT 'pending',
      editor_id    INT REFERENCES users(id) ON DELETE SET NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id             SERIAL PRIMARY KEY,
      submission_id  INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      originality    INT,
      methodology    INT,
      clarity        INT,
      significance   INT,
      recommendation VARCHAR(50),
      comments       TEXT,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS decisions (
      id         SERIAL PRIMARY KEY,
      paper_id   INT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      editor_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      decision   VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS revisions (
      id              SERIAL PRIMARY KEY,
      submission_id   INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      file_path       TEXT NOT NULL,
      response_letter TEXT NOT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message    TEXT NOT NULL,
      is_read    BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('[initdb] All tables ready.')
}

module.exports = initDb
