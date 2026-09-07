const mongoose = require("mongoose");

const thumbnailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    style: {
      type: String,
      default: "Bold"
    },
    colors: {
      type: [String],
      default: []
    },
    aspectRatio: {
      type: String,
      default: "16:9"
    },
    prompt: {
      type: String,
      required: true
    },
    originalPrompt: {
      type: String,
      default: ""
    },
    imageUrl: {
      type: String,
      required: true
    },
    sourceImage: {
      type: String,
      default: ""
    },
    topicContext: {
      type: String,
      default: ""
    },
    headlineText: {
      type: String,
      default: ""
    },
    badgeText: {
      type: String,
      default: ""
    },
    templatePreset: {
      type: String,
      default: "Standard"
    },
    selectedModel: {
      type: String,
      default: "flux"
    },
    youtubeReference: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "public"
    },
    likes: {
      type: Number,
      default: 0
    },
    mode: {
      type: String,
      enum: ["generate", "recreate"],
      default: "generate"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Thumbnail", thumbnailSchema);