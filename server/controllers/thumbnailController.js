const Thumbnail = require("../models/Thumbnail");

const ALLOWED_IMAGE_HOSTS = new Set(["image.pollinations.ai", "pollinations.ai"]);

const getUserThumbnails = async (req, res, next) => {
  try {
    const thumbnails = await Thumbnail.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, thumbnails });
  } catch (error) {
    next(error);
  }
};

const deleteThumbnail = async (req, res, next) => {
  try {
    const thumbnail = await Thumbnail.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!thumbnail) {
      return res.status(404).json({ success: false, message: "Thumbnail not found" });
    }

    return res.json({ success: true, message: "Thumbnail deleted" });
  } catch (error) {
    next(error);
  }
};

const getCommunityFeed = async (req, res, next) => {
  try {
    const thumbnails = await Thumbnail.find({ visibility: "public" })
      .sort({ createdAt: -1 })
      .limit(24)
      .populate("userId", "name");

    const trendingIdeas = [
      "MrBeast-style challenge thumbnail",
      "Cinematic podcast cover layout",
      "Gaming highlight with neon glow",
      "Finance breakdown with bold contrast",
      "Fitness transformation split-screen"
    ];

    return res.json({ success: true, thumbnails, trendingIdeas });
  } catch (error) {
    next(error);
  }
};

const proxyThumbnailImage = async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: "Image URL is required" });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({ success: false, message: "Invalid image URL" });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({ success: false, message: "Unsupported image protocol" });
    }

    if (!ALLOWED_IMAGE_HOSTS.has(parsedUrl.hostname)) {
      return res.status(400).json({ success: false, message: "Image host is not allowed" });
    }

    const response = await fetch(parsedUrl.toString());

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Unable to load thumbnail image"
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const cacheControl = response.headers.get("cache-control");

    res.setHeader("Content-Type", contentType);

    if (cacheControl) {
      res.setHeader("Cache-Control", cacheControl);
    }

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const likeThumbnail = async (req, res, next) => {
  try {
    const thumbnail = await Thumbnail.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!thumbnail) {
      return res.status(404).json({ success: false, message: "Thumbnail not found" });
    }

    return res.json({ success: true, likes: thumbnail.likes });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserThumbnails,
  deleteThumbnail,
  getCommunityFeed,
  proxyThumbnailImage,
  likeThumbnail
};