require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => {
  res.send('Server running')
})

const PORT = process.env.PORT || 10000

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`)
})