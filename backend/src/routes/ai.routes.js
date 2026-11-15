const express = require('express');
const aiController = require("../controllers/ai.controller")
const { optionalAuth } = require("../middleware/auth")

const router = express.Router();


// Works without an account; logged-in users get the review saved to their history
router.post("/get-review", optionalAuth, aiController.getReview)


module.exports = router;
