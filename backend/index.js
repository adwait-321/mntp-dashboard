import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import feedbackRoutes from './routes/feedback.js'

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

app.use('/api/auth', authRoutes)
app.use('/api/feedback', feedbackRoutes)

app.get('/', (req, res) => res.send('API running'))

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
)