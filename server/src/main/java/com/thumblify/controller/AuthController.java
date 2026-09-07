package com.thumblify.controller;

import com.thumblify.dto.AuthDtos;
import com.thumblify.model.User;
import com.thumblify.repository.UserRepository;
import com.thumblify.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthDtos.SignupRequest request) {
        String name = request.getName();
        String email = request.getEmail();
        String password = request.getPassword();

        if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "All fields are required"
            ));
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "User already exists"
            ));
        }

        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(name.trim(), normalizedEmail, hashedPassword);
        user = userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId());
        AuthDtos.UserDto userDto = new AuthDtos.UserDto(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new AuthDtos.AuthResponse(true, "Signup successful", token, userDto)
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDtos.LoginRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Email and password are required"
            ));
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Invalid credentials"
            ));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Invalid credentials"
            ));
        }

        String token = tokenProvider.generateToken(user.getId());
        AuthDtos.UserDto userDto = new AuthDtos.UserDto(user);

        return ResponseEntity.ok(
                new AuthDtos.AuthResponse(true, "Login successful", token, userDto)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Unauthorized"
            ));
        }

        // Fetch fresh user data from database
        Optional<User> freshUser = userRepository.findById(user.getId());
        AuthDtos.UserDto userDto = new AuthDtos.UserDto(freshUser.orElse(user));

        return ResponseEntity.ok(new AuthDtos.ProfileResponse(true, userDto));
    }
}
