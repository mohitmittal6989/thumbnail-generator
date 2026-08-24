const express = require("express");
const { generateThumbnail } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/generate-thumbnail", authMiddleware, generateThumbnail);

module.exports = router;