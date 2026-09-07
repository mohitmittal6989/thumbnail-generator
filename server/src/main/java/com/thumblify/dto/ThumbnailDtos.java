package com.thumblify.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.thumblify.model.Thumbnail;

import java.util.ArrayList;
import java.util.List;

public class ThumbnailDtos {

    public static class GenerateRequest {
        private String title;
        private String style = "Bold";
        private List<String> colors = new ArrayList<>();
        private String aspectRatio = "16:9";
        private String prompt = "";
        private String sourceImage = "";
        private String changeRequest = "";
        private String templatePreset = "Standard";
        private String selectedModel = "flux";
        private String headlineText = "";
        private String badgeText = "";
        private String mode = "generate";

        public GenerateRequest() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getStyle() { return style; }
        public void setStyle(String style) { this.style = style; }
        public List<String> getColors() { return colors; }
        public void setColors(List<String> colors) { this.colors = colors; }
        public String getAspectRatio() { return aspectRatio; }
        public void setAspectRatio(String aspectRatio) { this.aspectRatio = aspectRatio; }
        public String getPrompt() { return prompt; }
        public void setPrompt(String prompt) { this.prompt = prompt; }
        public String getSourceImage() { return sourceImage; }
        public void setSourceImage(String sourceImage) { this.sourceImage = sourceImage; }
        public String getChangeRequest() { return changeRequest; }
        public void setChangeRequest(String changeRequest) { this.changeRequest = changeRequest; }
        public String getTemplatePreset() { return templatePreset; }
        public void setTemplatePreset(String templatePreset) { this.templatePreset = templatePreset; }
        public String getSelectedModel() { return selectedModel; }
        public void setSelectedModel(String selectedModel) { this.selectedModel = selectedModel; }
        public String getHeadlineText() { return headlineText; }
        public void setHeadlineText(String headlineText) { this.headlineText = headlineText; }
        public String getBadgeText() { return badgeText; }
        public void setBadgeText(String badgeText) { this.badgeText = badgeText; }
        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
    }

    public static class GenerateResponse {
        private boolean success;
        private String message;
        private Thumbnail thumbnail;
        private int credits;

        public GenerateResponse() {}

        public GenerateResponse(boolean success, String message, Thumbnail thumbnail, int credits) {
            this.success = success;
            this.message = message;
            this.thumbnail = thumbnail;
            this.credits = credits;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Thumbnail getThumbnail() { return thumbnail; }
        public void setThumbnail(Thumbnail thumbnail) { this.thumbnail = thumbnail; }
        public int getCredits() { return credits; }
        public void setCredits(int credits) { this.credits = credits; }
    }

    public static class ListResponse {
        private boolean success;
        private List<Thumbnail> thumbnails;

        public ListResponse() {}

        public ListResponse(boolean success, List<Thumbnail> thumbnails) {
            this.success = success;
            this.thumbnails = thumbnails;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public List<Thumbnail> getThumbnails() { return thumbnails; }
        public void setThumbnails(List<Thumbnail> thumbnails) { this.thumbnails = thumbnails; }
    }

    public static class CommunityFeedResponse {
        private boolean success;
        private List<Thumbnail> thumbnails;
        private List<String> trendingIdeas;

        public CommunityFeedResponse() {}

        public CommunityFeedResponse(boolean success, List<Thumbnail> thumbnails, List<String> trendingIdeas) {
            this.success = success;
            this.thumbnails = thumbnails;
            this.trendingIdeas = trendingIdeas;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public List<Thumbnail> getThumbnails() { return thumbnails; }
        public void setThumbnails(List<Thumbnail> thumbnails) { this.thumbnails = thumbnails; }
        public List<String> getTrendingIdeas() { return trendingIdeas; }
        public void setTrendingIdeas(List<String> trendingIdeas) { this.trendingIdeas = trendingIdeas; }
    }

    public static class LikeResponse {
        private boolean success;
        private int likes;

        public LikeResponse() {}

        public LikeResponse(boolean success, int likes) {
            this.success = success;
            this.likes = likes;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public int getLikes() { return likes; }
        public void setLikes(int likes) { this.likes = likes; }
    }
}
