package com.thumblify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class TopicIntelligenceService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GEMINI_MODEL:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    @Value("${GROQ_MODEL:openai/gpt-oss-120b}")
    private String groqModel;

    public static class TopicContextResult {
        private String topic;
        private String context;
        private String source;

        public TopicContextResult(String topic, String context, String source) {
            this.topic = topic;
            this.context = context;
            this.source = source;
        }

        public String getTopic() { return topic; }
        public String getContext() { return context; }
        public String getSource() { return source; }
    }

    private String sanitize(String val) {
        if (val == null) return "";
        return val.replaceAll("\\s+", " ").trim();
    }

    public Map<String, String> fetchWikipediaSnippet(String query) {
        try {
            String cleanQuery = query.replaceAll("[^\\w\\s-]", " ").trim();
            if (cleanQuery.isEmpty()) return null;

            String url = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="
                    + URLEncoder.encode(cleanQuery, StandardCharsets.UTF_8)
                    + "&format=json&utf8=1";

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return null;

            JsonNode root = objectMapper.readTree(res.body());
            JsonNode search = root.path("query").path("search");
            if (!search.isArray() || search.isEmpty()) return null;

            JsonNode first = search.get(0);
            String title = first.path("title").asText("");
            String snippet = first.path("snippet").asText("").replaceAll("<[^>]*>", "");

            Map<String, String> result = new HashMap<>();
            result.put("title", title);
            result.put("snippet", snippet.length() > 250 ? snippet.substring(0, 250) : snippet);
            return result;
        } catch (Exception e) {
            return null;
        }
    }

    public String fetchGeminiWebGrounding(String topic, String extraPrompt) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) return null;

        try {
            String prompt = String.join("\n",
                    "You are a visual research specialist analyzing a YouTube video topic to ensure the thumbnail image accurately reflects the real-world subject.",
                    "Video Topic: \"" + topic + "\"",
                    extraPrompt != null && !extraPrompt.isEmpty() ? "Extra Creative Direction: \"" + extraPrompt + "\"" : "",
                    "Provide concise visual intelligence in 2-3 sentences covering:",
                    "1. The exact physical subject, real-world objects, entities, or people.",
                    "2. Authentic real-world visual hallmarks, real colors, textures, and iconic details.",
                    "3. The most natural setting/environment (e.g. rustic bakery kitchen, modern developer desk, racetrack, studio).",
                    "Be direct, factual, and strictly focused on physical visual reality."
            );

            Map<String, Object> body = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> partMap = new HashMap<>();
            partMap.put("parts", List.of(Map.of("text", prompt)));
            contents.add(partMap);
            body.put("contents", contents);

            body.put("tools", List.of(Map.of("googleSearch", Collections.emptyMap())));
            body.put("generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 250));

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return null;

            JsonNode root = objectMapper.readTree(res.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asText("");
                    return sanitize(text);
                }
            }
        } catch (Exception e) {
            // Graceful fallback
        }
        return null;
    }

    public String analyzeTopicWithGroq(String topic, String extraPrompt, String webSnippet) {
        if (groqApiKey == null || groqApiKey.trim().isEmpty()) return null;

        try {
            String userContent = "Topic: \"" + topic + "\"\n"
                    + (extraPrompt != null && !extraPrompt.isEmpty() ? "Extra Details: \"" + extraPrompt + "\"\n" : "")
                    + (webSnippet != null && !webSnippet.isEmpty() ? "Web Knowledge: " + webSnippet : "");

            Map<String, Object> body = new HashMap<>();
            body.put("model", groqModel != null && !groqModel.isEmpty() ? groqModel : "openai/gpt-oss-120b");
            body.put("temperature", 0.3);
            body.put("max_tokens", 300);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", "You are a visual researcher. Break down the video topic into authentic real-world visual components. Identify the exact physical subject, authentic environment, and key visual details in 2 concise sentences."));
            messages.add(Map.of("role", "user", "content", userContent));
            body.put("messages", messages);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(6))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return null;

            JsonNode root = objectMapper.readTree(res.body());
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String text = choices.get(0).path("message").path("content").asText("");
                return sanitize(text);
            }
        } catch (Exception e) {
            // Graceful fallback
        }
        return null;
    }

    public TopicContextResult getTopicContext(String topic, String extraPrompt) {
        String cleanTopic = sanitize(topic);
        if (cleanTopic.isEmpty()) {
            return new TopicContextResult("", "", "none");
        }

        // 1. Try Gemini Grounding
        String webGrounding = fetchGeminiWebGrounding(cleanTopic, extraPrompt);
        if (webGrounding != null && !webGrounding.isEmpty()) {
            return new TopicContextResult(cleanTopic, webGrounding, "google_search_grounding");
        }

        // 2. Try Wikipedia Snippet + Groq
        Map<String, String> wiki = fetchWikipediaSnippet(cleanTopic);
        String wikiSnippet = wiki != null ? wiki.get("title") + ": " + wiki.get("snippet") : "";
        String groqAnalysis = analyzeTopicWithGroq(cleanTopic, extraPrompt, wikiSnippet);
        if (groqAnalysis != null && !groqAnalysis.isEmpty()) {
            return new TopicContextResult(cleanTopic, groqAnalysis, wiki != null ? "wikipedia_and_llm" : "llm_domain_reasoning");
        }

        // 3. Fallback direct context
        String fallbackContext = "Authentic real-world representation of " + cleanTopic
                + (extraPrompt != null && !extraPrompt.isEmpty() ? ", specifically featuring: " + extraPrompt : "");
        return new TopicContextResult(cleanTopic, fallbackContext, "direct_fallback");
    }
}
