// Load environment variables
require('dotenv').config()

// Import dependencies
const express = require('express')
const cors = require('cors')

// Initialize Express
const app = express()

// Configuration
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Middleware
app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

// Health-check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'JoinLab API is running',
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`JoinLab API listening at http://localhost:${PORT}`)
})