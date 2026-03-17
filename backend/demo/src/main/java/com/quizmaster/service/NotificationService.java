package com.quizmaster.service;

import com.quizmaster.dto.response.NotificationResponse;
import com.quizmaster.dto.response.UnreadCountResponse;
import com.quizmaster.entity.Notification;
import com.quizmaster.entity.User;
import com.quizmaster.enums.NotificationType;
import com.quizmaster.exception.ResourceNotFoundException;
import com.quizmaster.mapper.NotificationMapper;
import com.quizmaster.repository.NotificationRepository;
import com.quizmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    // ─── Internal helpers ────────────────────────────────

    /**
     * Creates and persists an in-app notification for a user.
     */
    @Transactional
    public Notification sendNotification(User user, NotificationType type,
            String title, String message,
            String actionUrl,
            String referenceUuid, String referenceType) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .referenceUuid(referenceUuid)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification sent to user {} [{}]: {}", user.getId(), type, title);
        return notification;
    }

    /**
     * Sends a notification specifically for auto-submitted quiz attempts.
     */
    @Transactional
    public void sendAutoSubmitNotification(User student, String quizTitle,
            String attemptUuid, BigDecimal marksObtained,
            BigDecimal totalMarks, BigDecimal percentage) {
        String title = "Quiz Auto-Submitted: " + quizTitle;
        String message = String.format(
                "Your quiz attempt for \"%s\" was automatically submitted because the time limit expired. "
                        + "Score: %.2f / %.2f (%.1f%%). "
                        + "You can review your results in the attempt history.",
                quizTitle,
                marksObtained != null ? marksObtained : BigDecimal.ZERO,
                totalMarks != null ? totalMarks : BigDecimal.ZERO,
                percentage != null ? percentage : BigDecimal.ZERO);

        sendNotification(
                student,
                NotificationType.QUIZ_AUTO_SUBMITTED,
                title,
                message,
                "/quizzes/attempts/" + attemptUuid,
                attemptUuid,
                "QUIZ_ATTEMPT");
    }

    // ─── Public API methods ──────────────────────────────

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(notificationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markAsRead(String notificationUuid, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = notificationRepository
                .findByUuidAndUserId(notificationUuid, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (Boolean.TRUE.equals(notification.getIsRead())) {
            return notificationMapper.toResponse(notification);
        }

        notification.setIsRead(true);
        notification.setReadAt(Instant.now());
        notification = notificationRepository.save(notification);
        return notificationMapper.toResponse(notification);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationRepository.markAllAsReadByUserId(user.getId(), Instant.now());
    }
}

