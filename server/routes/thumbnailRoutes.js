const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserThumbnails,
  deleteThumbnail,
  getCommunityFeed,
  proxyThumbnailImage,
  likeThumbnail
} = require("../controllers/thumbnailController");

const router = express.Router();

router.get("/proxy", proxyThumbnailImage);
router.get("/community", getCommunityFeed);
router.post("/community/:id/like", likeThumbnail);
router.get("/", authMiddleware, getUserThumbnails);
router.delete("/:id", authMiddleware, deleteThumbnail);

module.exports = router;