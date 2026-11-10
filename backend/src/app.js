const express = require('express');
const aiRoutes = require('./routes/ai.routes')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { MAX_CODE_CHARS } = require('./controllers/ai.controller')

const app = express()

// Render (and most hosts) sit behind one proxy; needed so rate limiting sees the real client IP
app.set('trust proxy', 1)

// Comma-separated list of frontend origins allowed to call the API
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)

const perIpLimit = Number(process.env.RATE_LIMIT_MAX) || 20
const dailyLimit = Number(process.env.DAILY_REVIEW_LIMIT) || 500

app.use(cors({
    origin(origin, callback) {
        // Requests without an Origin header (curl, health checks) are not browser cross-origin calls
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(null, false)
    },
    // Let the frontend read how long to wait after hitting a limit
    exposedHeaders: ['Retry-After', 'RateLimit', 'RateLimit-Policy']
}))

app.use(express.json({ limit: '100kb' }))

// Per-IP limit: stops one user from spamming reviews
const perIpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: perIpLimit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // CORS preflights are free; only count real review requests
    skip: req => req.method === 'OPTIONS',
    message: 'Too many review requests. Please wait a few minutes and try again.'
})

// Global limit: caps total Gemini usage per day across all users
const dailyLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    limit: dailyLimit,
    standardHeaders: false,
    legacyHeaders: false,
    skip: req => req.method === 'OPTIONS',
    keyGenerator: () => 'global',
    // Only successful reviews use up the daily budget; rejected/invalid requests don't
    skipFailedRequests: true,
    handler: (req, res) => {
        const resetTime = req.rateLimit && req.rateLimit.resetTime
        if (resetTime) {
            const seconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
            res.set('Retry-After', String(seconds))
        }
        res.status(429).send('The daily review limit has been reached. Please try again later.')
    }
})

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use('/ai', perIpLimiter, dailyLimiter, aiRoutes)

// Turn oversized or malformed JSON bodies into readable errors
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).send('Request is too large. Please send less code.')
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).send('Invalid JSON in request body.')
    }
    return next(err)
})

console.log(`Allowed origins: ${allowedOrigins.join(', ')}`)
console.log(`Rate limits: ${perIpLimit} reviews per IP every 15 min, ${dailyLimit} reviews per day in total`)
console.log(`Max code length: ${MAX_CODE_CHARS} characters`)

module.exports = app
