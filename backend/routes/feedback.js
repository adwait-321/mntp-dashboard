import express from 'express'
import Feedback from '../models/Feedback.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { userId, name, email, message, rating } = req.body
    const feedback = await Feedback.create({ userId, name, email, message, rating })
    res.status(201).json({ message: 'Feedback submitted', feedback })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router