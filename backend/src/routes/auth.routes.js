const express = require('express')
const rateLimit = require('express-rate-limit')
const authController = require('../controllers/auth.controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// Slows down password guessing; successful logins don't count
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: req => req.method === 'OPTIONS',
    skipSuccessfulRequests: true,
    message: 'Too many attempts. Please wait a few minutes and try again.'
})

router.post('/register', authLimiter, authController.register)
router.post('/login', authLimiter, authController.login)
router.get('/me', requireAuth, authController.me)

module.exports = router
