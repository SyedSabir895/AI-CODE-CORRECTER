const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 80
    },
    code: {
        type: String,
        required: true
    },
    review: {
        type: String,
        required: true
    }
}, { timestamps: true })

// History is always listed per user, newest first
reviewSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Review', reviewSchema)
