const Thumbnail = require("../models/Thumbnail");
const User = require("../models/User");
const {
  optimizePrompt,
  buildImageUrl,
  generateThumbnailImage,
  normalizeSourceImageUrl,
  canUseSourceImageForGeneration,
  warmImageUrl
} = require("../utils/thumbnailHelpers");

const generateThumbnail = async (req, res, next) => {
  try {
    const {
      title,
      style,
      colors = [],
      aspectRatio = "16:9",
      prompt: extraPrompt = "",
      sourceImage = "",
      changeRequest = "",
      templatePreset = "Standard",
      selectedModel = "gemini",
      headlineText = "",
      badgeText = "",
      mode = "generate"
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (req.user.credits <= 0) {
      return res.status(400).json({ success: false, message: "No credits left" });
    }

    const normalizedSourceImage = normalizeSourceImageUrl(sourceImage);
    const usableSourceImage = canUseSourceImageForGeneration(normalizedSourceImage)
      ? normalizedSourceImage
      : "";

    const optimizationResult = await optimizePrompt({
      title,
      style,
      colors,
      aspectRatio,
      extraPrompt,
      sourceImage: usableSourceImage,
      changeRequest,
      templatePreset,
      selectedModel,
      headlineText,
      badgeText,
      mode
    });

    const optimizedPrompt = typeof optimizationResult === "string"
      ? optimizationResult
      : optimizationResult.prompt;
    const topicContext = typeof optimizationResult === "object"
      ? optimizationResult.topicContext
      : "";
    const finalHeadline = typeof optimizationResult === "object"
      ? (headlineText || optimizationResult.suggestedHeadline)
      : headlineText;
    const finalBadge = typeof optimizationResult === "object"
      ? (badgeText || optimizationResult.suggestedBadge)
      : badgeText;

    const rawImageUrl = await generateThumbnailImage({
      prompt: optimizedPrompt,
      aspectRatio,
      options: {
        mode,
        sourceImage: usableSourceImage,
        style: style,
        model: selectedModel
      }
    });
    const imageUrl = await warmImageUrl(rawImageUrl);

    const youtubeReference = typeof optimizationResult === "object"
      ? (optimizationResult.youtubeReference || null)
      : null;

    const thumbnail = await Thumbnail.create({
      userId: req.user._id,
      title,
      style,
      colors,
      aspectRatio,
      prompt: optimizedPrompt,
      originalPrompt: extraPrompt,
      imageUrl,
      sourceImage: normalizedSourceImage,
      topicContext,
      headlineText: finalHeadline,
      badgeText: finalBadge,
      templatePreset,
      selectedModel,
      youtubeReference,
      mode
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { credits: -1 } },
      { new: true }
    ).select("-password");

    return res.status(201).json({
      success: true,
      message: "Thumbnail generated",
      thumbnail,
      credits: updatedUser.credits
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateThumbnail
};