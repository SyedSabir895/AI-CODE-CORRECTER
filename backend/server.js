require('dotenv').config()

const REQUIRED_ENV = [ 'GOOGLE_GEMINI_KEY', 'MONGODB_URI', 'JWT_SECRET' ]
const missing = REQUIRED_ENV.filter(name => !process.env[name])
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
}

const app = require('./src/app')
const connectDB = require('./src/db')

const PORT = process.env.PORT || 3000

connectDB(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })
    .catch(error => {
        console.error('Could not connect to MongoDB:', error.message)
        process.exit(1)
    })
