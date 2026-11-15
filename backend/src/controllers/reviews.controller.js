const mongoose = require('mongoose')
const Review = require('../models/review.model')

const PAGE_SIZE = 20

module.exports.listReviews = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)

    try {
        const [ reviews, total ] = await Promise.all([
            Review.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .select('title createdAt'),
            Review.countDocuments({ user: req.userId })
        ])

        res.json({
            reviews: reviews.map(r => ({ id: r.id, title: r.title, createdAt: r.createdAt })),
            page,
            hasMore: page * PAGE_SIZE < total
        })
    } catch (error) {
        console.error('List reviews failed:', error.message)
        res.status(500).send('Could not load your reviews.')
    }
}

module.exports.getReview = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send('Review not found.')
    }

    try {
        // Filtering by user too means nobody can read someone else's review by guessing an id
        const review = await Review.findOne({ _id: req.params.id, user: req.userId })
        if (!review) {
            return res.status(404).send('Review not found.')
        }
        res.json({
            id: review.id,
            title: review.title,
            code: review.code,
            review: review.review,
            createdAt: review.createdAt
        })
    } catch (error) {
        console.error('Get review failed:', error.message)
        res.status(500).send('Could not load this review.')
    }
}

module.exports.deleteReview = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send('Review not found.')
    }

    try {
        const result = await Review.deleteOne({ _id: req.params.id, user: req.userId })
        if (result.deletedCount === 0) {
            return res.status(404).send('Review not found.')
        }
        res.status(204).end()
    } catch (error) {
        console.error('Delete review failed:', error.message)
        res.status(500).send('Could not delete this review.')
    }
}
