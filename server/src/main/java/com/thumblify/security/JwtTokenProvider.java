package com.thumblify.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long validityInMilliseconds = 30L * 24 * 60 * 60 * 1000; // 30 days

    public JwtTokenProvider(@Value("${JWT_SECRET:replace_with_a_strong_secret_key_at_least_32_bytes}") String secret) {
        this.key = getSecretKey(secret);
    }

    private SecretKey getSecretKey(String secret) {
        try {
            byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
            if (bytes.length < 32) {
                // Hash with SHA-256 to ensure minimum 256 bits for HMAC-SHA256
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                bytes = md.digest(bytes);
            }
            return Keys.hmacShaKeyFor(bytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize JWT secret key", e);
        }
    }

    public String generateToken(String userId) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .subject(userId)
                .claim("id", userId)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String id = claims.get("id", String.class);
        return id != null ? id : claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
