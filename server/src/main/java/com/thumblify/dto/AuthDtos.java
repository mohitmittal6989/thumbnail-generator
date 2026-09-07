package com.thumblify.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.thumblify.model.User;

import java.util.Date;

public class AuthDtos {

    public static class SignupRequest {
        private String name;
        private String email;
        private String password;

        public SignupRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public LoginRequest() {}

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserDto {
        @JsonProperty("_id")
        private String mongoId;
        private String id;
        private String name;
        private String email;
        private int credits;
        private Date createdAt;
        private Date updatedAt;

        public UserDto() {}

        public UserDto(User user) {
            if (user != null) {
                this.id = user.getId();
                this.mongoId = user.getId();
                this.name = user.getName();
                this.email = user.getEmail();
                this.credits = user.getCredits();
                this.createdAt = user.getCreatedAt();
                this.updatedAt = user.getUpdatedAt();
            }
        }

        public String get_id() { return mongoId; }
        public void set_id(String mongoId) { this.mongoId = mongoId; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; this.mongoId = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public int getCredits() { return credits; }
        public void setCredits(int credits) { this.credits = credits; }
        public Date getCreatedAt() { return createdAt; }
        public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
        public Date getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class AuthResponse {
        private boolean success;
        private String message;
        private String token;
        private UserDto user;

        public AuthResponse() {}

        public AuthResponse(boolean success, String message, String token, UserDto user) {
            this.success = success;
            this.message = message;
            this.token = token;
            this.user = user;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }
    }

    public static class ProfileResponse {
        private boolean success;
        private UserDto user;

        public ProfileResponse() {}

        public ProfileResponse(boolean success, UserDto user) {
            this.success = success;
            this.user = user;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }
    }
}
