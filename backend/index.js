import './env.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

import express  from 'express'
import mongoose from 'mongoose'
import cors     from 'cors'
import https    from 'https'
import http     from 'http'

import authRoutes     from './routes/auth.js'
import feedbackRoutes from './routes/feedback.js'
import authGoogle     from './routes/authGoogle.js'
import domesticRoutes from './routes/domestic.js'

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

app.use('/api/auth',     authRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/auth',     authGoogle)
app.use('/api/domestic', domesticRoutes)

app.get('/', (req, res) => res.send('API running'))

// ── Self-ping to prevent Render.com sleep ──────────────────────
const RENDER_URL = process.env.RENDER_URL

if (!RENDER_URL) {
  console.warn('⚠️  RENDER_URL not set — self-ping disabled')
} else {
  setInterval(() => {
    try {
      // Pick http or https based on URL
      const client = RENDER_URL.startsWith('https') ? https : http

      client.get(RENDER_URL, (res) => {
        console.log(`Self-ping OK: ${res.statusCode}`)
      }).on('error', (err) => {
        console.error('Self-ping error:', err.message)
      })
    } catch (err) {
      console.error('Self-ping failed:', err.message)
    }
  }, 10 * 60 * 1000) // every 10 minutes

  console.log(`Self-ping enabled → ${RENDER_URL}`)
}

app.listen(process.env.PORT || 3000, () =>
  console.log(`Server running on port ${process.env.PORT || 3000}`)
)