const Groq = require("groq-sdk");
const { getCachedPrompt, setCachedPrompt } = require("./promptCache");
const { getTopicContext } = require("./topicIntelligence");
const { searchYouTubeReference } = require("./youtubeResearch");

const SUPPORTED_REFERENCE_IMAGE_HOSTS = new Set([
  "image.pollinations.ai",
  "pollinations.ai"
]);

const ratioMap = {
  "16:9": {
    label: "wide YouTube thumbnail 16:9 landscape composition",
    width: 1280,
    height: 720
  },
  "1:1": {
    label: "square 1:1 composition",
    width: 1080,
    height: 1080
  },
  "9:16": {
    label: "vertical 9:16 portrait composition",
    width: 900,
    height: 1600
  }
};

const styleVisuals = {
  Bold: "vibrant intense color contrast, sharp dynamic camera angle, expressive energetic focal subject, dramatic neon rim lighting, 8k hyper-detailed",
  Minimal: "clean minimalist modern aesthetic, elegant matte surfaces, single iconic 3D subject, soft studio illumination, sleek uncluttered background",
  Gaming: "intense esports aesthetic, neon cyan and magenta rim light, glowing particle effects, dark atmospheric battle arena, unreal engine 5 render",
  Cinematic: "35mm anamorphic movie still, dramatic volumetric lighting, moody shadows, photorealistic texture details, cinematic color grading",
  Finance: "dark navy and luxury gold aesthetic, glowing 3D holographic charts and crypto elements, polished executive atmosphere, high contrast",
  Podcast: "crisp studio microphone in foreground, warm ambient bokeh lights, acoustic studio backdrop, charismatic expressive creator",
  "3D Render": "Pixar and Octane 3D render style, glossy materials, vibrant volumetric lighting, stylized character, soft global illumination",
  Anime: "vibrant modern anime style, crisp cel-shaded lines, glowing atmospheric particles, dynamic action pose, rich colors"
};

const templateVisuals = {
  "High-Energy Challenge": "intense authentic facial expression, dramatic natural lighting, dynamic candid action framing, 35mm documentary photography",
  "Tech & Product": "clean modern studio backdrop, soft natural key light, crisp physical product details, genuine curious human expression",
  "Finance & Business": "sophisticated office atmosphere, natural window lighting, real desk environment, deep focus and authentic determination",
  "Split-Screen VS": "dynamic visual contrast between two real-world scenarios, natural documentary photography, authentic realism",
  "Gaming & Esports": "realistic creator battlestation, authentic atmospheric LED practical lights, concentrated human expression",
  "Minimal & Clean": "elegant minimalist composition, soft natural window light, organic textures, calm focused subject"
};

const sanitizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const joinColors = (colors) => (
  Array.isArray(colors) && colors.length
    ? colors.join(", ")
    : "natural cinematic tones"
);

const compactPrompt = (value) => {
  const cleaned = sanitizeText(value)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/^(\*\*|\*|#)?\s*(Prompt|Visual Prompt|Image Prompt|Scene|Subject|Thumbnail Prompt)\s*(\*\*|\*|#)?:\s*/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/(\*\*|\*|_|`)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  // Ensure prompt stays under safe length limit while retaining full visual context
  const words = cleaned.split(" ").filter(Boolean).slice(0, 75);
  return words.join(" ").trim().replace(/[.,;:!?]+$/g, "");
};

const extractHeadlineAndBadge = (title, template = "") => {
  const clean = sanitizeText(title).toUpperCase();
  const words = clean.split(" ").filter(Boolean);

  let headline = "";
  let badge = "🔥 10X";

  if (template === "High-Energy Challenge") {
    headline = words.slice(0, 3).join(" ") || "I TRIED IT!";
    badge = "🚨 VIRAL";
  } else if (template === "Tech & Product") {
    headline = words.slice(0, 2).join(" ") || "HONEST REVIEW";
    badge = "⚡ TECH";
  } else if (template === "Finance & Business") {
    headline = "$100K/MO";
    badge = "💰 WEALTH";
  } else if (template === "Split-Screen VS") {
    headline = "BEFORE vs AFTER";
    badge = "⚡ VS";
  } else {
    headline = words.slice(0, 3).join(" ") || "VIRAL SECRETS";
    badge = "🔥 10X";
  }

  return { headline, badge };
};

const buildSystemPrompt = (payload = {}) => {
  const hasSubject = Boolean(payload.sourceImage);
  return [
    "You are a precision AI Image Prompt Engineer for YouTube thumbnail generation.",
    "Your mission: Convert the user's video topic and visual description into ONE crystal-clear, zero-ambiguity, highly specific visual prompt describing the thumbnail scene (35 to 50 words).",
    "",
    "CRITICAL DIRECTIVES:",
    "1. 100% TOPIC & DESCRIPTION FIDELITY: If the user provides visual details, depict EVERY subject, action, prop, and setting they typed. If no details are provided, depict the exact physical scenario of the topic.",
    hasSubject ? "2. FOCAL SUBJECT REPLACEMENT: The user has attached an image of the person/subject to feature as the main focal character in the foreground with an expressive reaction matching the topic." : "2. FOCAL SUBJECT & ACTION FIRST: Start immediately with the main subject and their physical action and expression.",
    "3. CONCRETE PHYSICAL DETAILS: Use concrete tangible nouns. No meta fluff, no tutorials, no articles.",
    "4. FORMAT: Output ONLY ONE single descriptive prompt paragraph (35-50 words). No preamble, no quotes, no markdown."
  ].filter(Boolean).join("\n");
};

const buildUserMessage = (payload) => {
  const title = sanitizeText(payload.title);
  const extraPrompt = sanitizeText(payload.extraPrompt || payload.prompt);
  const template = payload.templatePreset || payload.template || "High-Energy Challenge";
  const templateDesc = templateVisuals[template] || "";
  const topicContext = sanitizeText(payload.topicContext);
  const hasSubject = Boolean(payload.sourceImage);

  return [
    `Video Topic: "${title}"`,
    `User Exact Visual Description & Details: "${extraPrompt || 'Create a clear, single iconic focal scene matching this video topic'}"`,
    hasSubject ? "User Attached Reference Subject Photo: YES (Smartly replace the focal character/subject with the person in the photo)" : "",
    template ? `Style Category: ${template} (${templateDesc})` : "",
    topicContext ? `Real-World Topic Context: "${topicContext}"` : ""
  ].filter(Boolean).join("\n");
};

const createFallbackPrompt = (payload) => {
  const title = sanitizeText(payload.title);
  const extraPrompt = sanitizeText(payload.extraPrompt || payload.prompt);

  const direction = [
    extraPrompt ? extraPrompt : `Authentic photograph of ${title}`,
    "one clear dominant focal subject with vivid details",
    "crisp sharp focus",
    "natural directional lighting",
    "real physical textures",
    "photorealistic",
    "8k"
  ].filter(Boolean);

  return compactPrompt(direction.join(", "));
};

const optimizeWithGroq = async (payload) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 2500,
      messages: [
        { role: "system", content: buildSystemPrompt(payload) },
        { role: "user", content: buildUserMessage(payload) }
      ]
    });

    const output = compactPrompt(completion.choices?.[0]?.message?.content);
    return output || null;
  } catch (error) {
    console.error("Groq primary model error:", error.message || error);
    try {
      const fallbackCompletion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        temperature: 0.3,
        max_tokens: 2500,
        messages: [
          { role: "system", content: buildSystemPrompt(payload) },
          { role: "user", content: buildUserMessage(payload) }
        ]
      });
      return compactPrompt(fallbackCompletion.choices?.[0]?.message?.content) || null;
    } catch (fallbackError) {
      console.error("Groq fallback model error:", fallbackError.message || fallbackError);
      return null;
    }
  }
};

const optimizeWithGemini = async (payload) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${buildSystemPrompt(payload)}\n\n${buildUserMessage(payload)}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error response:", response.status, errText);
      return null;
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return compactPrompt(candidateText) || null;
  } catch (err) {
    console.error("Gemini fetch error:", err.message || err);
    return null;
  }
};

const optimizePrompt = async (payload) => {
  // Step 1: In parallel, gather web intelligence & search YouTube for viral thumbnail reference
  const [topicResearch, youtubeRef] = await Promise.all([
    payload.topicContext
      ? Promise.resolve({ context: payload.topicContext })
      : getTopicContext(payload.title, payload.extraPrompt || payload.prompt),
    payload.youtubeReference
      ? Promise.resolve(payload.youtubeReference)
      : searchYouTubeReference(`${payload.title} ${payload.extraPrompt || payload.prompt || ""}`.trim())
  ]);

  payload.topicContext = topicResearch?.context || "";
  payload.youtubeReference = youtubeRef || null;

  const { headline, badge } = extractHeadlineAndBadge(
    payload.title,
    payload.templatePreset || payload.template
  );

  const cached = getCachedPrompt(payload);
  if (cached) {
    return {
      prompt: cached,
      topicContext: payload.topicContext,
      suggestedHeadline: payload.headlineText || headline,
      suggestedBadge: payload.badgeText || badge,
      youtubeReference: payload.youtubeReference
    };
  }

  // 1. Primary: Groq (ultra-fast, high-capacity, photojournalism emotional reasoning)
  let prompt = await optimizeWithGroq(payload);

  // 2. Secondary Fallback: Gemini
  if (!prompt) {
    prompt = await optimizeWithGemini(payload);
  }

  // 3. Fallback: Programmatic visual description
  if (!prompt) {
    prompt = createFallbackPrompt(payload);
  }

  setCachedPrompt(payload, prompt);

  return {
    prompt,
    topicContext: payload.topicContext,
    suggestedHeadline: payload.headlineText || headline,
    suggestedBadge: payload.badgeText || badge,
    youtubeReference: payload.youtubeReference
  };
};

const normalizeSourceImageUrl = (value) => {
  const sourceImage = sanitizeText(value);
  if (!sourceImage) return "";

  // Base64 data URIs directly from client image upload
  if (sourceImage.startsWith("data:image/")) {
    return sourceImage;
  }

  try {
    const parsedUrl = new URL(sourceImage);
    if (parsedUrl.pathname.endsWith("/thumbnails/proxy")) {
      const proxiedUrl = parsedUrl.searchParams.get("url");
      if (!proxiedUrl) return "";
      const originalUrl = new URL(proxiedUrl);
      return ["http:", "https:"].includes(originalUrl.protocol) ? originalUrl.toString() : "";
    }
    return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.toString() : "";
  } catch {
    return "";
  }
};

const canUseSourceImageForGeneration = (value) => {
  const normalizedUrl = normalizeSourceImageUrl(value);
  if (!normalizedUrl) return false;

  // Base64 images are always valid for multimodal AI generation
  if (normalizedUrl.startsWith("data:image/")) {
    return true;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

const getModelForStyle = (style, options = {}) => {
  if (options.model && options.model !== "flux") return options.model;
  if (options.sourceImage) return "kontext";
  if (style === "3D Render") return "flux-3d";
  if (style === "Anime") return "flux-anime";
  // Use flux-realism by default for ultra-high human skin and physical object photorealism
  return "flux-realism";
};

const buildImageUrl = (prompt, aspectRatio, options = {}) => {
  const aspectConfig = ratioMap[aspectRatio] || ratioMap["16:9"];
  const seed = Math.floor(Math.random() * 10000000);
  const selectedModel = getModelForStyle(options.style, options);

  // Enhance prompt for maximum visual impact & YouTube CTR
  const styleKeywords = styleVisuals[options.style] || styleVisuals.Bold;
  const enhancedPrompt = `${prompt}, ${styleKeywords}, YouTube thumbnail aesthetic, ultra detailed, sharp focus, 8k resolution, cinematic studio lighting`;
  
  const query = new URLSearchParams({
    width: String(aspectConfig.width),
    height: String(aspectConfig.height),
    seed: String(seed),
    model: selectedModel,
    enhance: "true",
    nologo: "true",
    private: "true"
  });

  if (options.sourceImage && !options.sourceImage.startsWith("data:image/")) {
    query.set("image", options.sourceImage);
  }

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?${query.toString()}`;
};

const generateWithGeminiImage = async ({ prompt, aspectRatio = "16:9", style = "Bold", sourceImage = "" }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY provided for image generation");
    return null;
  }

  // Model list to try in order
  const customModel = process.env.GEMINI_IMAGE_MODEL;
  const candidateModels = customModel
    ? [customModel, "gemini-2.5-flash-image", "gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "imagen-3.0-generate-002"]
    : ["gemini-2.5-flash-image", "gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-3-pro-image", "imagen-3.0-generate-002"];

  // Parse attached source image if provided
  let subjectImagePart = null;
  if (sourceImage) {
    if (sourceImage.startsWith("data:image/")) {
      const matches = sourceImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        subjectImagePart = {
          inlineData: {
            mimeType: matches[1] || "image/jpeg",
            data: matches[2]
          }
        };
      }
    } else if (/^https?:\/\//i.test(sourceImage)) {
      try {
        const fetchRes = await fetch(sourceImage);
        if (fetchRes.ok) {
          const buffer = Buffer.from(await fetchRes.arrayBuffer());
          const mimeType = fetchRes.headers.get("content-type") || "image/jpeg";
          subjectImagePart = {
            inlineData: {
              mimeType,
              data: buffer.toString("base64")
            }
          };
        }
      } catch (err) {
        console.warn("Failed to fetch source image for multimodal generation:", err.message || err);
      }
    }
  }

  // Enrich prompt for high-CTR thumbnail generation with smart subject replacement
  const enhancedPrompt = subjectImagePart
    ? `Generate a high-CTR professional YouTube thumbnail in ${aspectRatio} aspect ratio. Style: ${style}. Visual composition: ${prompt}. CRITICAL DIRECTIVE: Smartly replace the primary focal character/subject in the scene with the person or subject from the attached reference image. Retain their recognizable facial likeness, expression, features, and identity while seamlessly blending them into the scene with dramatic studio lighting, rich contrast, and realistic textures.`
    : `Generate a high-CTR professional YouTube thumbnail in ${aspectRatio} aspect ratio. Style: ${style}. Visual composition: ${prompt}. Photorealistic, vibrant color grading, studio lighting, crisp 8k details, visually striking focal subject.`;

  for (const model of candidateModels) {
    try {
      // 1. Try generateContent endpoint (standard for Gemini multimodal image models)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const parts = [];
      if (subjectImagePart) {
        parts.push(subjectImagePart);
      }
      parts.push({ text: enhancedPrompt });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const resParts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = resParts.find((p) => p.inlineData && p.inlineData.data);
        if (imagePart && imagePart.inlineData.data) {
          const mime = imagePart.inlineData.mimeType || "image/jpeg";
          console.log(`Successfully generated thumbnail image using Gemini model: ${model}`);
          return `data:${mime};base64,${imagePart.inlineData.data}`;
        }
      }

      // 2. Try predict endpoint (used by Imagen models)
      if (model.includes("imagen")) {
        const predictUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
        const predictRes = await fetch(predictUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: ["16:9", "1:1", "9:16"].includes(aspectRatio) ? aspectRatio : "16:9",
              outputMimeType: "image/jpeg"
            }
          })
        });

        if (predictRes.ok) {
          const data = await predictRes.json();
          const base64 = data.predictions?.[0]?.bytesBase64Encoded;
          const mime = data.predictions?.[0]?.mimeType || "image/jpeg";
          if (base64) {
            console.log(`Successfully generated thumbnail image using Imagen model: ${model}`);
            return `data:${mime};base64,${base64}`;
          }
        }
      }
    } catch (err) {
      console.warn(`Gemini image generation attempt with model ${model} failed:`, err.message || err);
    }
  }

  return null;
};

const generateThumbnailImage = async ({ prompt, aspectRatio, options = {} }) => {
  const isFluxRequested = options.model === "flux" || options.model === "flux-realism" || options.model === "flux-3d" || options.model === "flux-anime";
  
  if (!isFluxRequested) {
    try {
      const geminiImage = await generateWithGeminiImage({
        prompt,
        aspectRatio,
        style: options.style,
        sourceImage: options.sourceImage
      });

      if (geminiImage) {
        return geminiImage;
      }
    } catch (error) {
      console.warn("Gemini image generation failed, falling back to Pollinations Flux:", error.message || error);
    }
  }

  // Fallback / Standard: Enhanced Pollinations Flux-Realism with enhance=true
  return buildImageUrl(prompt, aspectRatio, options);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const warmImageUrl = async (imageUrl, attempts = 2) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("data:")) return imageUrl;

  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(imageUrl, {
        headers: { Accept: "image/*" }
      });
      if (response.ok) {
        await response.arrayBuffer();
        return imageUrl;
      }
    } catch {
      // Ignore transient upstream failures and retry below.
    }
    await sleep(500 * (index + 1));
  }
  return imageUrl;
};

module.exports = {
  optimizePrompt,
  buildImageUrl,
  generateWithGeminiImage,
  generateThumbnailImage,
  normalizeSourceImageUrl,
  canUseSourceImageForGeneration,
  warmImageUrl
};