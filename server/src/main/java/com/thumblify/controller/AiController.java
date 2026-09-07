package com.thumblify.controller;

import com.thumblify.dto.ThumbnailDtos;
import com.thumblify.model.Thumbnail;
import com.thumblify.model.User;
import com.thumblify.repository.ThumbnailRepository;
import com.thumblify.repository.UserRepository;
import com.thumblify.service.ThumbnailHelperService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final UserRepository userRepository;
    private final ThumbnailRepository thumbnailRepository;
    private final ThumbnailHelperService thumbnailHelperService;

    public AiController(UserRepository userRepository,
                        ThumbnailRepository thumbnailRepository,
                        ThumbnailHelperService thumbnailHelperService) {
        this.userRepository = userRepository;
        this.thumbnailRepository = thumbnailRepository;
        this.thumbnailHelperService = thumbnailHelperService;
    }

    @PostMapping("/generate-thumbnail")
    public ResponseEntity<?> generateThumbnail(@AuthenticationPrincipal User authUser,
                                              @RequestBody ThumbnailDtos.GenerateRequest request) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Unauthorized"
            ));
        }

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Title is required"
            ));
        }

        User user = userRepository.findById(authUser.getId()).orElse(authUser);
        if (user.getCredits() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "No credits left"
            ));
        }

        String normalizedSourceImage = thumbnailHelperService.normalizeSourceImageUrl(request.getSourceImage());
        String usableSourceImage = thumbnailHelperService.canUseSourceImageForGeneration(normalizedSourceImage)
                ? normalizedSourceImage
                : "";

        request.setSourceImage(usableSourceImage);

        // 1. Optimize Prompt & Research
        ThumbnailHelperService.OptimizationResult optResult = thumbnailHelperService.optimizePrompt(request);

        // 2. Generate Image (Gemini Multimodal or Pollinations Flux)
        String rawImageUrl = thumbnailHelperService.generateThumbnailImage(
                optResult.getPrompt(),
                request.getAspectRatio(),
                request.getStyle(),
                request.getSelectedModel(),
                usableSourceImage
        );

        // 3. Warm image cache
        String finalImageUrl = thumbnailHelperService.warmImageUrl(rawImageUrl);

        // 4. Save Thumbnail to MongoDB
        Thumbnail thumbnail = new Thumbnail();
        thumbnail.setUserId(user.getId());
        thumbnail.setTitle(request.getTitle().trim());
        thumbnail.setStyle(request.getStyle() != null ? request.getStyle() : "Bold");
        thumbnail.setColors(request.getColors() != null ? request.getColors() : java.util.Collections.emptyList());
        thumbnail.setAspectRatio(request.getAspectRatio() != null ? request.getAspectRatio() : "16:9");
        thumbnail.setPrompt(optResult.getPrompt());
        thumbnail.setOriginalPrompt(request.getPrompt() != null ? request.getPrompt() : "");
        thumbnail.setImageUrl(finalImageUrl);
        thumbnail.setSourceImage(normalizedSourceImage);
        thumbnail.setTopicContext(optResult.getTopicContext());
        thumbnail.setHeadlineText(optResult.getSuggestedHeadline());
        thumbnail.setBadgeText(optResult.getSuggestedBadge());
        thumbnail.setTemplatePreset(request.getTemplatePreset() != null ? request.getTemplatePreset() : "Standard");
        thumbnail.setSelectedModel(request.getSelectedModel() != null ? request.getSelectedModel() : "flux");
        thumbnail.setYoutubeReference(optResult.getYoutubeReference());
        thumbnail.setVisibility("public");
        thumbnail.setLikes(0);
        thumbnail.setMode(request.getMode() != null ? request.getMode() : "generate");
        thumbnail.setCreatedAt(new Date());
        thumbnail.setUpdatedAt(new Date());

        thumbnail = thumbnailRepository.save(thumbnail);

        // 5. Decrement 1 credit
        user.setCredits(user.getCredits() - 1);
        user = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new ThumbnailDtos.GenerateResponse(true, "Thumbnail generated", thumbnail, user.getCredits())
        );
    }
}
