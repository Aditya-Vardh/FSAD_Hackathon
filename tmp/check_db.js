const db = require('c:/Users/adity/peer-review/server/db')

async function check() {
  try {
    const [papers] = await db.query("SELECT id, title, file_path FROM papers ORDER BY id DESC LIMIT 5")
    console.log("Recent Papers:", JSON.stringify(papers))
    
    const [revisions] = await db.query("SHOW COLUMNS FROM revisions")
    console.log("Revisions Columns:", JSON.stringify(revisions))
    
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

check()
