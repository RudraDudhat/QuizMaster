package com.quizmaster.controller;

import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.request.*;
import com.quizmaster.dto.response.AuthResponse;
import com.quizmaster.entity.User;
import com.quizmaster.repository.UserRepository;
import com.quizmaster.service.AuthService;
import com.quizmaster.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UserRepository userRepository;

    /**
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    /**
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    /**
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    /**
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    /**
     * POST /api/auth/password-reset/request
     */
    @PostMapping("/password-reset/request")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestPasswordReset(request.getEmail());
        // Always return success (prevents user enumeration)
        return ResponseEntity.ok(ApiResponse.success("If the email exists, a reset link has been sent"));
    }

    /**
     * POST /api/auth/password-reset/confirm
     */
    @PostMapping("/password-reset/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.confirmPasswordReset(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successful"));
    }

    /**
     * GET /api/auth/me — returns the currently authenticated user's info.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        Map<String, Object> userInfo = new java.util.HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("uuid", user.getUuid());
        userInfo.put("email", user.getEmail());
        userInfo.put("fullName", user.getFullName());
        userInfo.put("displayName", user.getDisplayName());
        userInfo.put("bio", user.getBio());
        userInfo.put("role", user.getRole().name());
        userInfo.put("isEmailVerified", user.getIsEmailVerified());
        userInfo.put("xpPoints", user.getXpPoints());
        userInfo.put("streakDays", user.getStreakDays());
        userInfo.put("lastLoginAt", user.getLastLoginAt());
        userInfo.put("createdAt", user.getCreatedAt());
        userInfo.put("profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "");
        return ResponseEntity.ok(ApiResponse.success("Current user", userInfo));
    }

    /**
     * PUT /api/auth/me — update the current user's profile fields.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCurrentUser(
            @RequestBody com.quizmaster.dto.request.UpdateProfileRequest body,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (body.getFullName() != null && !body.getFullName().isBlank()) {
            user.setFullName(body.getFullName().trim());
        }
        if (body.getDisplayName() != null) {
            user.setDisplayName(body.getDisplayName().trim().isEmpty() ? null : body.getDisplayName().trim());
        }
        if (body.getBio() != null) {
            user.setBio(body.getBio().trim().isEmpty() ? null : body.getBio().trim());
        }
        if (body.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(body.getProfilePictureUrl().trim().isEmpty() ? null : body.getProfilePictureUrl().trim());
        }
        userRepository.save(user);

        return getCurrentUser(authentication);
    }

    /**
     * POST /api/auth/me/password — change the current user's password.
     */
    @PostMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody @jakarta.validation.Valid com.quizmaster.dto.request.ChangePasswordRequest body,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        authService.changePassword(userDetails.getUsername(), body);
        return ResponseEntity.ok(ApiResponse.success("Password updated", null));
    }
}
