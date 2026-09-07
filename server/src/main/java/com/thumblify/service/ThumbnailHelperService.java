package com.thumblify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thumblify.dto.ThumbnailDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ThumbnailHelperService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final TopicIntelligenceService topicIntelligenceService;
    private final YouTubeResearchService youTubeResearchService;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    @Value("${GROQ_MODEL:openai/gpt-oss-120b}")
    private String groqModel;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GEMINI_MODEL:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${GEMINI_IMAGE_MODEL:gemini-2.5-flash-image}")
    private String geminiImageModel;

    private static final Map<String, Dimension> RATIO_MAP = Map.of(
            "16:9", new Dimension(1280, 720),
            "1:1", new Dimension(1080, 1080),
            "9:16", new Dimension(900, 1600)
    );

    private static final Map<String, String> STYLE_VISUALS = Map.of(
            "Bold", "vibrant intense color contrast, sharp dynamic camera angle, expressive energetic focal subject, dramatic neon rim lighting, 8k hyper-detailed",
            "Minimal", "clean minimalist modern aesthetic, elegant matte surfaces, single iconic 3D subject, soft studio illumination, sleek uncluttered background",
            "Gaming", "intense esports aesthetic, neon cyan and magenta rim light, glowing particle effects, dark atmospheric battle arena, unreal engine 5 render",
            "Cinematic", "35mm anamorphic movie still, dramatic volumetric lighting, moody shadows, photorealistic texture details, cinematic color grading",
            "Finance", "dark navy and luxury gold aesthetic, glowing 3D holographic charts and crypto elements, polished executive atmosphere, high contrast",
            "Podcast", "crisp studio microphone in foreground, warm ambient bokeh lights, acoustic studio backdrop, charismatic expressive creator",
            "3D Render", "Pixar and Octane 3D render style, glossy materials, vibrant volumetric lighting, stylized character, soft global illumination",
            "Anime", "vibrant modern anime style, crisp cel-shaded lines, glowing atmospheric particles, dynamic action pose, rich colors"
    );

    private static final Map<String, String> TEMPLATE_VISUALS = Map.of(
            "High-Energy Challenge", "intense authentic facial expression, dramatic natural lighting, dynamic candid action framing, 35mm documentary photography",
            "Tech & Product", "clean modern studio backdrop, soft natural key light, crisp physical product details, genuine curious human expression",
            "Finance & Business", "sophisticated office atmosphere, natural window lighting, real desk environment, deep focus and authentic determination",
            "Split-Screen VS", "dynamic visual contrast between two real-world scenarios, natural documentary photography, authentic realism",
            "Gaming & Esports", "realistic creator battlestation, authentic atmospheric LED practical lights, concentrated human expression",
            "Minimal & Clean", "elegant minimalist composition, soft natural window light, organic textures, calm focused subject"
    );

    public static class Dimension {
        public final int width;
        public final int height;
        public Dimension(int width, int height) {
            this.width = width;
            this.height = height;
        }
    }

    public static class OptimizationResult {
        private String prompt;
        private String topicContext;
        private String suggestedHeadline;
        private String suggestedBadge;
        private Map<String, Object> youtubeReference;

        public OptimizationResult(String prompt, String topicContext, String suggestedHeadline, String suggestedBadge, Map<String, Object> youtubeReference) {
            this.prompt = prompt;
            this.topicContext = topicContext;
            this.suggestedHeadline = suggestedHeadline;
            this.suggestedBadge = suggestedBadge;
            this.youtubeReference = youtubeReference;
        }

        public String getPrompt() { return prompt; }
        public String getTopicContext() { return topicContext; }
        public String getSuggestedHeadline() { return suggestedHeadline; }
        public String getSuggestedBadge() { return suggestedBadge; }
        public Map<String, Object> getYoutubeReference() { return youtubeReference; }
    }

    public static class HeadlineAndBadge {
        public final String headline;
        public final String badge;
        public HeadlineAndBadge(String headline, String badge) {
            this.headline = headline;
            this.badge = badge;
        }
    }

    public ThumbnailHelperService(TopicIntelligenceService topicIntelligenceService, YouTubeResearchService youTubeResearchService) {
        this.topicIntelligenceService = topicIntelligenceService;
        this.youTubeResearchService = youTubeResearchService;
    }

    private String sanitize(String val) {
        if (val == null) return "";
        return val.replaceAll("\\s+", " ").trim();
    }

    public String compactPrompt(String value) {
        String cleaned = sanitize(value)
                .replaceAll("(?i)<think>[\\s\\S]*?</think>", "")
                .replaceAll("(?i)<think>[\\s\\S]*", "")
                .replaceAll("(?i)^(\\*{1,2}|#)?\\s*(Prompt|Visual Prompt|Image Prompt|Scene|Subject|Thumbnail Prompt)\\s*(\\*{1,2}|#)?:\\s*", "")
                .replaceAll("^[\"'`]+|[\"'`]+$", "")
                .replaceAll("(\\*{1,2}|_|`)", "")
                .replaceAll("\\s+", " ")
                .trim();

        if (cleaned.isEmpty()) return "";

        String[] words = cleaned.split(" ");
        int limit = Math.min(words.length, 75);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < limit; i++) {
            if (!words[i].isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(words[i]);
            }
        }
        return sb.toString().replaceAll("[.,;:!?]+$", "").trim();
    }

    public HeadlineAndBadge extractHeadlineAndBadge(String title, String template) {
        String clean = sanitize(title).toUpperCase();
        String[] words = clean.split(" ");
        List<String> validWords = new ArrayList<>();
        for (String w : words) {
            if (!w.trim().isEmpty()) validWords.add(w.trim());
        }

        String headline;
        String badge = "🔥 10X";

        if ("High-Energy Challenge".equalsIgnoreCase(template)) {
            headline = subListJoin(validWords, 3, "I TRIED IT!");
            badge = "🚨 VIRAL";
        } else if ("Tech & Product".equalsIgnoreCase(template)) {
            headline = subListJoin(validWords, 2, "HONEST REVIEW");
            badge = "⚡ TECH";
        } else if ("Finance & Business".equalsIgnoreCase(template)) {
            headline = "$100K/MO";
            badge = "💰 WEALTH";
        } else if ("Split-Screen VS".equalsIgnoreCase(template)) {
            headline = "BEFORE vs AFTER";
            badge = "⚡ VS";
        } else {
            headline = subListJoin(validWords, 3, "VIRAL SECRETS");
            badge = "🔥 10X";
        }

        return new HeadlineAndBadge(headline, badge);
    }

    private String subListJoin(List<String> list, int count, String defaultVal) {
        if (list.isEmpty()) return defaultVal;
        int limit = Math.min(list.size(), count);
        return String.join(" ", list.subList(0, limit));
    }

    private String buildSystemPrompt(boolean hasSubject) {
        List<String> lines = new ArrayList<>();
        lines.add("You are a precision AI Image Prompt Engineer for YouTube thumbnail generation.");
        lines.add("Your mission: Convert the user's video topic and visual description into ONE crystal-clear, zero-ambiguity, highly specific visual prompt describing the thumbnail scene (35 to 50 words).");
        lines.add("");
        lines.add("CRITICAL DIRECTIVES:");
        lines.add("1. 100% TOPIC & DESCRIPTION FIDELITY: If the user provides visual details, depict EVERY subject, action, prop, and setting they typed. If no details are provided, depict the exact physical scenario of the topic.");
        if (hasSubject) {
            lines.add("2. FOCAL SUBJECT REPLACEMENT: The user has attached an image of the person/subject to feature as the main focal character in the foreground with an expressive reaction matching the topic.");
        } else {
            lines.add("2. FOCAL SUBJECT & ACTION FIRST: Start immediately with the main subject and their physical action and expression.");
        }
        lines.add("3. CONCRETE PHYSICAL DETAILS: Use concrete tangible nouns. No meta fluff, no tutorials, no articles.");
        lines.add("4. FORMAT: Output ONLY ONE single descriptive prompt paragraph (35-50 words). No preamble, no quotes, no markdown.");
        return String.join("\n", lines);
    }

    private String buildUserMessage(ThumbnailDtos.GenerateRequest req, String topicContext, boolean hasSubject) {
        String title = sanitize(req.getTitle());
        String extraPrompt = sanitize(req.getPrompt());
        String template = req.getTemplatePreset() != null ? req.getTemplatePreset() : "High-Energy Challenge";
        String templateDesc = TEMPLATE_VISUALS.getOrDefault(template, "");

        List<String> lines = new ArrayList<>();
        lines.add("Video Topic: \"" + title + "\"");
        lines.add("User Exact Visual Description & Details: \"" + (!extraPrompt.isEmpty() ? extraPrompt : "Create a clear, single iconic focal scene matching this video topic") + "\"");
        if (hasSubject) {
            lines.add("User Attached Reference Subject Photo: YES (Smartly replace the focal character/subject with the person in the photo)");
        }
        if (!template.isEmpty()) {
            lines.add("Style Category: " + template + " (" + templateDesc + ")");
        }
        if (topicContext != null && !topicContext.isEmpty()) {
            lines.add("Real-World Topic Context: \"" + topicContext + "\"");
        }
        return String.join("\n", lines);
    }

    private String createFallbackPrompt(ThumbnailDtos.GenerateRequest req) {
        String title = sanitize(req.getTitle());
        String extraPrompt = sanitize(req.getPrompt());

        List<String> parts = new ArrayList<>();
        parts.add(!extraPrompt.isEmpty() ? extraPrompt : "Authentic photograph of " + title);
        parts.add("one clear dominant focal subject with vivid details");
        parts.add("crisp sharp focus");
        parts.add("natural directional lighting");
        parts.add("real physical textures");
        parts.add("photorealistic");
        parts.add("8k");

        return compactPrompt(String.join(", ", parts));
    }

    private String optimizeWithGroq(ThumbnailDtos.GenerateRequest req, String topicContext, boolean hasSubject) {
        if (groqApiKey == null || groqApiKey.trim().isEmpty()) return null;

        String modelToUse = (groqModel != null && !groqModel.isEmpty()) ? groqModel : "openai/gpt-oss-120b";
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", modelToUse);
            body.put("temperature", 0.3);
            body.put("max_tokens", 2500);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", buildSystemPrompt(hasSubject)));
            messages.add(Map.of("role", "user", "content", buildUserMessage(req, topicContext, hasSubject)));
            body.put("messages", messages);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    String content = choices.get(0).path("message").path("content").asText("");
                    String compacted = compactPrompt(content);
                    if (!compacted.isEmpty()) return compacted;
                }
            }

            // Secondary fallback Groq model
            body.put("model", "openai/gpt-oss-20b");
            HttpRequest retryReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(6))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> retryRes = httpClient.send(retryReq, HttpResponse.BodyHandlers.ofString());
            if (retryRes.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(retryRes.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    String content = choices.get(0).path("message").path("content").asText("");
                    return compactPrompt(content);
                }
            }
        } catch (Exception e) {
            // Log & proceed to Gemini fallback
        }
        return null;
    }

    private String optimizeWithGemini(ThumbnailDtos.GenerateRequest req, String topicContext, boolean hasSubject) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) return null;

        try {
            String combinedPrompt = buildSystemPrompt(hasSubject) + "\n\n" + buildUserMessage(req, topicContext, hasSubject);

            Map<String, Object> body = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("parts", List.of(Map.of("text", combinedPrompt)));
            contents.add(part);
            body.put("contents", contents);
            body.put("generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 800));

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(7))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode parts = candidates.get(0).path("content").path("parts");
                    if (parts.isArray() && !parts.isEmpty()) {
                        String text = parts.get(0).path("text").asText("");
                        return compactPrompt(text);
                    }
                }
            }
        } catch (Exception e) {
            // Log & proceed
        }
        return null;
    }

    public OptimizationResult optimizePrompt(ThumbnailDtos.GenerateRequest req) {
        // Step 1: Research topic & YouTube reference
        TopicIntelligenceService.TopicContextResult research = topicIntelligenceService.getTopicContext(req.getTitle(), req.getPrompt());
        String topicContext = research != null ? research.getContext() : "";

        Map<String, Object> youtubeRef = youTubeResearchService.searchYouTubeReference(req.getTitle() + " " + req.getPrompt());

        HeadlineAndBadge headlineAndBadge = extractHeadlineAndBadge(req.getTitle(), req.getTemplatePreset());

        boolean hasSubject = req.getSourceImage() != null && !req.getSourceImage().trim().isEmpty();

        // 1. Primary: Groq
        String prompt = optimizeWithGroq(req, topicContext, hasSubject);

        // 2. Secondary: Gemini
        if (prompt == null || prompt.isEmpty()) {
            prompt = optimizeWithGemini(req, topicContext, hasSubject);
        }

        // 3. Fallback: Programmatic
        if (prompt == null || prompt.isEmpty()) {
            prompt = createFallbackPrompt(req);
        }

        String finalHeadline = req.getHeadlineText() != null && !req.getHeadlineText().isEmpty()
                ? req.getHeadlineText()
                : headlineAndBadge.headline;

        String finalBadge = req.getBadgeText() != null && !req.getBadgeText().isEmpty()
                ? req.getBadgeText()
                : headlineAndBadge.badge;

        return new OptimizationResult(prompt, topicContext, finalHeadline, finalBadge, youtubeRef);
    }

    public String normalizeSourceImageUrl(String value) {
        String sourceImage = sanitize(value);
        if (sourceImage.isEmpty()) return "";

        if (sourceImage.startsWith("data:image/")) {
            return sourceImage;
        }

        try {
            URI uri = URI.create(sourceImage);
            String path = uri.getPath();
            if (path != null && path.endsWith("/thumbnails/proxy")) {
                String query = uri.getQuery();
                if (query != null && query.contains("url=")) {
                    for (String param : query.split("&")) {
                        if (param.startsWith("url=")) {
                            String targetUrl = java.net.URLDecoder.decode(param.substring(4), StandardCharsets.UTF_8);
                            return targetUrl;
                        }
                    }
                }
            }
            if ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) {
                return uri.toString();
            }
        } catch (Exception e) {
            // Ignore invalid URLs
        }
        return "";
    }

    public boolean canUseSourceImageForGeneration(String value) {
        String normalized = normalizeSourceImageUrl(value);
        if (normalized.isEmpty()) return false;
        if (normalized.startsWith("data:image/")) return true;
        try {
            URI uri = URI.create(normalized);
            return "http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme());
        } catch (Exception e) {
            return false;
        }
    }

    private String getModelForStyle(String style, String model, String sourceImage) {
        if (model != null && !model.isEmpty() && !"flux".equalsIgnoreCase(model) && !"gemini".equalsIgnoreCase(model)) {
            return model;
        }
        if (sourceImage != null && !sourceImage.isEmpty()) return "kontext";
        if ("3D Render".equalsIgnoreCase(style)) return "flux-3d";
        if ("Anime".equalsIgnoreCase(style)) return "flux-anime";
        return "flux-realism";
    }

    public String buildImageUrl(String prompt, String aspectRatio, String style, String selectedModel, String sourceImage) {
        Dimension dim = RATIO_MAP.getOrDefault(aspectRatio, RATIO_MAP.get("16:9"));
        int seed = ThreadLocalRandom.current().nextInt(1000000, 9999999);
        String model = getModelForStyle(style, selectedModel, sourceImage);

        String styleKeywords = STYLE_VISUALS.getOrDefault(style, STYLE_VISUALS.get("Bold"));
        String enhancedPrompt = prompt + ", " + styleKeywords + ", YouTube thumbnail aesthetic, ultra detailed, sharp focus, 8k resolution, cinematic studio lighting";

        StringBuilder urlBuilder = new StringBuilder("https://image.pollinations.ai/prompt/");
        urlBuilder.append(URLEncoder.encode(enhancedPrompt, StandardCharsets.UTF_8));
        urlBuilder.append("?width=").append(dim.width);
        urlBuilder.append("&height=").append(dim.height);
        urlBuilder.append("&seed=").append(seed);
        urlBuilder.append("&model=").append(model);
        urlBuilder.append("&enhance=true");
        urlBuilder.append("&nologo=true");
        urlBuilder.append("&private=true");

        if (sourceImage != null && !sourceImage.isEmpty() && !sourceImage.startsWith("data:image/")) {
            urlBuilder.append("&image=").append(URLEncoder.encode(sourceImage, StandardCharsets.UTF_8));
        }

        return urlBuilder.toString();
    }

    public String generateWithGeminiImage(String prompt, String aspectRatio, String style, String sourceImage) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) return null;

        List<String> candidateModels = List.of(
                geminiImageModel != null && !geminiImageModel.isEmpty() ? geminiImageModel : "gemini-2.5-flash-image",
                "gemini-2.5-flash-image",
                "gemini-3.1-flash-image",
                "gemini-3.1-flash-lite-image",
                "imagen-3.0-generate-002"
        );

        Map<String, Object> subjectImagePart = null;
        if (sourceImage != null && !sourceImage.trim().isEmpty()) {
            if (sourceImage.startsWith("data:image/")) {
                Pattern pattern = Pattern.compile("^data:([A-Za-z-+/]+);base64,(.+)$");
                Matcher m = pattern.matcher(sourceImage);
                if (m.find()) {
                    String mime = m.group(1);
                    String base64 = m.group(2);
                    subjectImagePart = Map.of("inlineData", Map.of("mimeType", mime, "data", base64));
                }
            } else if (sourceImage.startsWith("http://") || sourceImage.startsWith("https://")) {
                try {
                    HttpRequest fetchReq = HttpRequest.newBuilder().uri(URI.create(sourceImage)).timeout(Duration.ofSeconds(5)).GET().build();
                    HttpResponse<byte[]> fetchRes = httpClient.send(fetchReq, HttpResponse.BodyHandlers.ofByteArray());
                    if (fetchRes.statusCode() == 200) {
                        String mime = fetchRes.headers().firstValue("content-type").orElse("image/jpeg");
                        String base64 = Base64.getEncoder().encodeToString(fetchRes.body());
                        subjectImagePart = Map.of("inlineData", Map.of("mimeType", mime, "data", base64));
                    }
                } catch (Exception ignored) {}
            }
        }

        String enhancedPrompt = subjectImagePart != null
                ? "Generate a high-CTR professional YouTube thumbnail in " + aspectRatio + " aspect ratio. Style: " + style + ". Visual composition: " + prompt + ". CRITICAL DIRECTIVE: Smartly replace the primary focal character/subject in the scene with the person or subject from the attached reference image. Retain their recognizable facial likeness, expression, features, and identity while seamlessly blending them into the scene with dramatic studio lighting, rich contrast, and realistic textures."
                : "Generate a high-CTR professional YouTube thumbnail in " + aspectRatio + " aspect ratio. Style: " + style + ". Visual composition: " + prompt + ". Photorealistic, vibrant color grading, studio lighting, crisp 8k details, visually striking focal subject.";

        for (String model : candidateModels) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;

                List<Map<String, Object>> parts = new ArrayList<>();
                if (subjectImagePart != null) {
                    parts.add(subjectImagePart);
                }
                parts.add(Map.of("text", enhancedPrompt));

                Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", parts)));

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(10))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                        .build();

                HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(res.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode resParts = candidates.get(0).path("content").path("parts");
                        if (resParts.isArray()) {
                            for (JsonNode p : resParts) {
                                JsonNode inlineData = p.path("inlineData");
                                String base64 = inlineData.path("data").asText(null);
                                if (base64 != null && !base64.isEmpty()) {
                                    String mime = inlineData.path("mimeType").asText("image/jpeg");
                                    return "data:" + mime + ";base64," + base64;
                                }
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    public String generateThumbnailImage(String prompt, String aspectRatio, String style, String selectedModel, String sourceImage) {
        boolean isFluxRequested = "flux".equalsIgnoreCase(selectedModel)
                || "flux-realism".equalsIgnoreCase(selectedModel)
                || "flux-3d".equalsIgnoreCase(selectedModel)
                || "flux-anime".equalsIgnoreCase(selectedModel);

        if (!isFluxRequested) {
            try {
                String geminiImage = generateWithGeminiImage(prompt, aspectRatio, style, sourceImage);
                if (geminiImage != null && !geminiImage.isEmpty()) {
                    return geminiImage;
                }
            } catch (Exception ignored) {}
        }

        return buildImageUrl(prompt, aspectRatio, style, selectedModel, sourceImage);
    }

    public String warmImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty() || imageUrl.startsWith("data:")) {
            return imageUrl;
        }

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(imageUrl))
                    .timeout(Duration.ofSeconds(4))
                    .header("Accept", "image/*")
                    .GET()
                    .build();
            httpClient.send(req, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ignored) {}

        return imageUrl;
    }
}
