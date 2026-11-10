const aiService = require("../services/ai.service")

const MAX_CODE_CHARS = Number(process.env.MAX_CODE_CHARS) || 20000

module.exports.MAX_CODE_CHARS = MAX_CODE_CHARS

module.exports.getReview = async (req, res) => {

    const code = req.body && req.body.code;

    if (typeof code !== "string" || !code.trim()) {
        return res.status(400).send("Code is required");
    }

    if (code.length > MAX_CODE_CHARS) {
        return res.status(413).send(`Code is too long. Please keep it under ${MAX_CODE_CHARS} characters.`);
    }

    try {
        const response = await aiService(code);
        res.send(response);
    } catch (error) {
        console.error("Review failed:", error.message);
        res.status(error.status || 500).send(error.message || "Failed to generate review");
    }

}
