const aiService = require("../services/ai.service")
const Review = require("../models/review.model")

const MAX_CODE_CHARS = Number(process.env.MAX_CODE_CHARS) || 20000

module.exports.MAX_CODE_CHARS = MAX_CODE_CHARS

function makeTitle(code) {
    const firstLine = code.split("\n").map(line => line.trim()).find(Boolean) || "Untitled"
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine
}

module.exports.getReview = async (req, res) => {

    const code = req.body && req.body.code;

    if (typeof code !== "string" || !code.trim()) {
        return res.status(400).send("Code is required");
    }

    if (code.length > MAX_CODE_CHARS) {
        return res.status(413).send(`Code is too long. Please keep it under ${MAX_CODE_CHARS} characters.`);
    }

    let response;
    try {
        response = await aiService(code);
    } catch (error) {
        console.error("Review failed:", error.message);
        return res.status(error.status || 500).send(error.message || "Failed to generate review");
    }

    if (req.userId) {
        try {
            const saved = await Review.create({
                user: req.userId,
                title: makeTitle(code),
                code,
                review: response
            });
            res.set("X-Review-Id", saved.id);
        } catch (error) {
            // Still return the review even if saving it to history fails
            console.error("Saving review failed:", error.message);
        }
    }

    res.send(response);

}
