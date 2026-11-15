const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
// bcrypt only uses the first 72 bytes of a password
const MAX_PASSWORD_LENGTH = 72

function createToken(user) {
    return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })
}

function publicUser(user) {
    return { id: user.id, email: user.email }
}

function readCredentials(body) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    return { email, password }
}

module.exports.register = async (req, res) => {
    const { email, password } = readCredentials(req.body)

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        return res.status(400).send('Please enter a valid email address.')
    }
    if (password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password) > MAX_PASSWORD_LENGTH) {
        return res.status(400).send(`Password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters long.`)
    }

    try {
        if (await User.exists({ email })) {
            return res.status(409).send('An account with this email already exists.')
        }

        const passwordHash = await bcrypt.hash(password, 12)
        const user = await User.create({ email, passwordHash })

        res.status(201).json({ token: createToken(user), user: publicUser(user) })
    } catch (error) {
        // Two sign-ups for the same email at once
        if (error.code === 11000) {
            return res.status(409).send('An account with this email already exists.')
        }
        console.error('Register failed:', error.message)
        res.status(500).send('Could not create account. Please try again.')
    }
}

module.exports.login = async (req, res) => {
    const { email, password } = readCredentials(req.body)

    if (!email || !password) {
        return res.status(400).send('Email and password are required.')
    }

    try {
        const user = await User.findOne({ email })
        const valid = user && await bcrypt.compare(password, user.passwordHash)

        // Same message either way, so the API doesn't reveal which emails have accounts
        if (!valid) {
            return res.status(401).send('Incorrect email or password.')
        }

        res.json({ token: createToken(user), user: publicUser(user) })
    } catch (error) {
        console.error('Login failed:', error.message)
        res.status(500).send('Could not log in. Please try again.')
    }
}

module.exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(401).send('Please log in to continue.')
        }
        res.json({ user: publicUser(user) })
    } catch (error) {
        console.error('Load user failed:', error.message)
        res.status(500).send('Could not load account.')
    }
}
