package com.quizmaster.controller;

import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.NotificationResponse;
import com.quizmaster.dto.response.UnreadCountResponse;
import com.quizmaster.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ─── GET /api/v1/notifications ───────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        String email = extractEmail(authentication);
        Page<NotificationResponse> notifications =
                notificationService.getNotifications(email, pageable);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
    }

    // ─── GET /api/v1/notifications/unread-count ──────────

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            Authentication authentication) {

        String email = extractEmail(authentication);
        UnreadCountResponse count = notificationService.getUnreadCount(email);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", count));
    }

    // ─── PATCH /api/v1/notifications/{notificationUuid}/read ─

    @PatchMapping("/{notificationUuid}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable String notificationUuid,
            Authentication authentication) {

        String email = extractEmail(authentication);
        NotificationResponse response = notificationService.markAsRead(notificationUuid, email);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", response));
    }

    // ─── PATCH /api/v1/notifications/read-all ────────────

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            Authentication authentication) {

        String email = extractEmail(authentication);
        notificationService.markAllAsRead(email);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    // ─── Helper ──────────────────────────────────────────

    private String extractEmail(Authentication authentication) {
        return ((UserDetails) authentication.getPrincipal()).getUsername();
    }
}
