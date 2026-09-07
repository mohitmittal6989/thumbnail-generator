package com.thumblify.controller;

import com.thumblify.dto.ThumbnailDtos;
import com.thumblify.model.Thumbnail;
import com.thumblify.model.User;
import com.thumblify.repository.ThumbnailRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/thumbnails")
public class ThumbnailController {

    private final ThumbnailRepository thumbnailRepository;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final Set<String> ALLOWED_IMAGE_HOSTS = Set.of(
            "image.pollinations.ai",
            "pollinations.ai"
    );

    private static final List<String> TRENDING_IDEAS = List.of(
            "MrBeast-style challenge thumbnail",
            "Cinematic podcast cover layout",
            "Gaming highlight with neon glow",
            "Finance breakdown with bold contrast",
            "Fitness transformation split-screen"
    );

    public ThumbnailController(ThumbnailRepository thumbnailRepository) {
        this.thumbnailRepository = thumbnailRepository;
    }

    @GetMapping
    public ResponseEntity<?> getUserThumbnails(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Unauthorized"
            ));
        }

        List<Thumbnail> thumbnails = thumbnailRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(new ThumbnailDtos.ListResponse(true, thumbnails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteThumbnail(@AuthenticationPrincipal User user, @PathVariable String id) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Unauthorized"
            ));
        }

        Optional<Thumbnail> thumbnailOpt = thumbnailRepository.findById(id);
        if (thumbnailOpt.isEmpty() || !user.getId().equals(thumbnailOpt.get().getUserId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Thumbnail not found"
            ));
        }

        thumbnailRepository.deleteById(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Thumbnail deleted"
        ));
    }

    @GetMapping("/community")
    public ResponseEntity<?> getCommunityFeed() {
        List<Thumbnail> thumbnails = thumbnailRepository.findByVisibilityOrderByCreatedAtDesc(
                "public",
                PageRequest.of(0, 24)
        );

        return ResponseEntity.ok(new ThumbnailDtos.CommunityFeedResponse(true, thumbnails, TRENDING_IDEAS));
    }

    @PostMapping("/community/{id}/like")
    public ResponseEntity<?> likeThumbnail(@PathVariable String id) {
        Optional<Thumbnail> thumbnailOpt = thumbnailRepository.findById(id);
        if (thumbnailOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Thumbnail not found"
            ));
        }

        Thumbnail thumbnail = thumbnailOpt.get();
        thumbnail.setLikes(thumbnail.getLikes() + 1);
        thumbnail = thumbnailRepository.save(thumbnail);

        return ResponseEntity.ok(new ThumbnailDtos.LikeResponse(true, thumbnail.getLikes()));
    }

    @GetMapping("/proxy")
    public ResponseEntity<?> proxyThumbnailImage(@RequestParam(required = false) String url) {
        if (url == null || url.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Image URL is required"
            ));
        }

        try {
            URI parsedUri = URI.create(url);
            String scheme = parsedUri.getScheme();
            String host = parsedUri.getHost();

            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "message", "Unsupported image protocol"
                ));
            }

            if (host == null || !ALLOWED_IMAGE_HOSTS.contains(host.toLowerCase())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "message", "Image host is not allowed"
                ));
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(parsedUri)
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode()).body(Map.of(
                        "success", false,
                        "message", "Unable to load thumbnail image"
                ));
            }

            String contentType = response.headers().firstValue("content-type").orElse("image/jpeg");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            response.headers().firstValue("cache-control").ifPresent(headers::setCacheControl);

            return new ResponseEntity<>(response.body(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Invalid image URL"
            ));
        }
    }
}
