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
     * Only fired by the auto-submit scheduler when a deadline expires —
     * NEVER from manual submit or grading flows.
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
                // Must match the frontend route exactly — otherwise the
                // notification click lands on a "Page not found" screen.
                "/student/results/" + attemptUuid,
                attemptUuid,
                "QUIZ_ATTEMPT");
    }

    /**
     * Notify the student that their quiz result is now ready — used after an
     * admin manually grades essay answers and the attempt totals are
     * recomputed.
     */
    @Transactional
    public void sendResultReadyNotification(User student, String quizTitle,
            String attemptUuid, BigDecimal marksObtained,
            BigDecimal totalMarks, BigDecimal percentage) {
        String title = "Result ready: " + quizTitle;
        String message = String.format(
                "Your instructor has finished grading your attempt for \"%s\". "
                        + "Final score: %.2f / %.2f (%.1f%%). "
                        + "Open your results to see the full breakdown.",
                quizTitle,
                marksObtained != null ? marksObtained : BigDecimal.ZERO,
                totalMarks != null ? totalMarks : BigDecimal.ZERO,
                percentage != null ? percentage : BigDecimal.ZERO);

        sendNotification(
                student,
                NotificationType.QUIZ_RESULT_READY,
                title,
                message,
                "/student/results/" + attemptUuid,
                attemptUuid,
                "QUIZ_ATTEMPT");
    }

    /**
     * Notify a student that a new quiz has been assigned to them. Used when
     * an admin publishes a quiz that's been targeted at one of the student's
     * groups, or when a student is added to a group that already has assigned
     * quizzes.
     */
    @Transactional
    public void sendQuizAssignedNotification(User student, String quizTitle,
            String quizUuid, Instant expiresAt) {
        String title = "New quiz: " + quizTitle;
        String due = expiresAt == null
                ? "No deadline."
                : "Closes " + expiresAt.toString().substring(0, 10) + ".";
        String message = String.format(
                "You've been assigned a new quiz: \"%s\". %s Open it to read the rules and start when you're ready.",
                quizTitle, due);

        sendNotification(
                student,
                NotificationType.QUIZ_ASSIGNED,
                title,
                message,
                "/student/quizzes/" + quizUuid,
                quizUuid,
                "QUIZ");
    }

    /**
     * Notify a student that their essay answer has been individually graded
     * — fired per essay, even if other essays on the same attempt are still
     * pending. Used together with {@link #sendResultReadyNotification} which
     * fires once the entire attempt becomes final.
     */
    @Transactional
    public void sendEssayGradedNotification(User student, String quizTitle,
            String attemptUuid, BigDecimal marksAwarded, BigDecimal maxMarks,
            Boolean isApproved, String note) {
        String verdict = Boolean.TRUE.equals(isApproved) ? "approved" : "marked";
        String title = "Essay " + verdict + ": " + quizTitle;
        StringBuilder message = new StringBuilder();
        message.append(String.format(
                "Your instructor %s an essay answer in \"%s\" — %.2f / %.2f marks.",
                verdict,
                quizTitle,
                marksAwarded != null ? marksAwarded : BigDecimal.ZERO,
                maxMarks != null ? maxMarks : BigDecimal.ZERO));
        if (note != null && !note.isBlank()) {
            message.append(" Feedback: ").append(note);
        }

        sendNotification(
                student,
                NotificationType.QUIZ_GRADED,
                title,
                message.toString(),
                "/student/results/" + attemptUuid + "/review",
                attemptUuid,
                "QUIZ_ATTEMPT");
    }

    /**
     * Notify a student that an assigned quiz is closing soon and they
     * haven't completed it yet. Fired daily by {@code QuizExpiryScheduler}.
     */
    @Transactional
    public void sendQuizExpiringNotification(User student, String quizTitle,
            String quizUuid, long hoursLeft) {
        String title = "Closing soon: " + quizTitle;
        String message = String.format(
                "\"%s\" closes in about %d hour%s and you haven't completed it yet. "
                        + "Open the quiz to attempt it before the deadline.",
                quizTitle,
                hoursLeft,
                hoursLeft == 1 ? "" : "s");

        sendNotification(
                student,
                NotificationType.QUIZ_EXPIRING,
                title,
                message,
                "/student/quizzes/" + quizUuid,
                quizUuid,
                "QUIZ");
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

