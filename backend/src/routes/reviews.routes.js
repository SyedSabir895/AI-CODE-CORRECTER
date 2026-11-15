const express = require('express')
const reviewsController = require('../controllers/reviews.controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.use(requireAuth)

router.get('/', reviewsController.listReviews)
router.get('/:id', reviewsController.getReview)
router.delete('/:id', reviewsController.deleteReview)

module.exports = router
