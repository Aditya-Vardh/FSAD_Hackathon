const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/papers', require('./routes/papers'))
app.use('/api/submissions', require('./routes/submissions'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/decisions', require('./routes/decisions'))
app.use('/api/revisions', require('./routes/revisions'))
app.use('/api/admin', require('./routes/admin'))
// Serve uploaded PDFs from an absolute path so it works regardless of CWD.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => res.send('Server running'))

app.listen(process.env.PORT, () => {
  console.log(`Server on port ${process.env.PORT}`)
})