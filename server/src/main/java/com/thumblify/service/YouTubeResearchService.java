package com.thumblify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class YouTubeResearchService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern YT_DATA_PATTERN = Pattern.compile("var ytInitialData = (\\{.*?\\});</script>", Pattern.DOTALL);
    private static final Pattern YT_DATA_PATTERN_ALT = Pattern.compile("ytInitialData\\s*=\\s*(\\{.+?\\});", Pattern.DOTALL);

    public Map<String, Object> searchYouTubeReference(String query) {
        if (query == null || query.trim().isEmpty()) {
            return null;
        }

        try {
            String cleanQuery = query.trim();
            String searchUrl = "https://www.youtube.com/results?search_query=" + URLEncoder.encode(cleanQuery, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(searchUrl))
                    .timeout(Duration.ofSeconds(6))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return null;
            }

            String html = response.body();
            Matcher matcher = YT_DATA_PATTERN.matcher(html);
            String jsonStr = null;
            if (matcher.find()) {
                jsonStr = matcher.group(1);
            } else {
                Matcher altMatcher = YT_DATA_PATTERN_ALT.matcher(html);
                if (altMatcher.find()) {
                    jsonStr = altMatcher.group(1);
                }
            }

            if (jsonStr == null) {
                return null;
            }

            JsonNode root = objectMapper.readTree(jsonStr);
            JsonNode contents = root.path("contents")
                    .path("twoColumnSearchResultsRenderer")
                    .path("primaryContents")
                    .path("sectionListRenderer")
                    .path("contents");

            if (!contents.isArray() || contents.isEmpty()) {
                return null;
            }

            JsonNode itemSection = contents.get(0).path("itemSectionRenderer").path("contents");
            if (!itemSection.isArray()) {
                return null;
            }

            for (JsonNode item : itemSection) {
                JsonNode video = item.path("videoRenderer");
                String videoId = video.path("videoId").asText(null);

                if (videoId != null && !videoId.isEmpty()) {
                    String title = "";
                    JsonNode titleRuns = video.path("title").path("runs");
                    if (titleRuns.isArray() && !titleRuns.isEmpty()) {
                        title = titleRuns.get(0).path("text").asText("");
                    }

                    String channel = "";
                    JsonNode ownerRuns = video.path("ownerText").path("runs");
                    if (ownerRuns.isArray() && !ownerRuns.isEmpty()) {
                        channel = ownerRuns.get(0).path("text").asText("");
                    }

                    String views = video.path("viewCountText").path("simpleText").asText(null);
                    if (views == null) {
                        JsonNode viewRuns = video.path("viewCountText").path("runs");
                        if (viewRuns.isArray() && !viewRuns.isEmpty()) {
                            views = viewRuns.get(0).path("text").asText("Viral Video");
                        } else {
                            views = "Viral Video";
                        }
                    }

                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("videoId", videoId);
                    result.put("title", title);
                    result.put("channel", channel);
                    result.put("views", views);
                    result.put("thumbnailUrl", "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg");
                    result.put("highResThumbnailUrl", "https://i.ytimg.com/vi/" + videoId + "/maxresdefault.jpg");
                    result.put("videoUrl", "https://www.youtube.com/watch?v=" + videoId);

                    return result;
                }
            }
        } catch (Exception e) {
            // Graceful fallback
        }

        return null;
    }
}
