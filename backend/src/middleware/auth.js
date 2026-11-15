const jwt = require('jsonwebtoken')

function readUserId(req) {
    const header = req.headers.authorization || ''
    const [ scheme, token ] = header.split(' ')
    if (scheme !== 'Bearer' || !token) return null

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        return payload.sub
    } catch {
        return undefined
    }
}

// Attaches req.userId when a valid token is sent; anonymous requests still go through
module.exports.optionalAuth = (req, res, next) => {
    const userId = readUserId(req)
    if (userId === undefined) {
        return res.status(401).send('Your session has expired. Please log in again.')
    }
    if (userId) req.userId = userId
    next()
}

// Rejects requests without a valid token
module.exports.requireAuth = (req, res, next) => {
    const userId = readUserId(req)
    if (!userId) {
        return res.status(401).send('Please log in to continue.')
    }
    req.userId = userId
    next()
}
