package com.quizmaster.scheduler;

import com.quizmaster.entity.Notification;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.QuizGroupAssignment;
import com.quizmaster.entity.StudentGroupMember;
import com.quizmaster.entity.User;
import com.quizmaster.enums.AttemptStatus;
import com.quizmaster.enums.NotificationType;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.repository.NotificationRepository;
import com.quizmaster.repository.QuizAttemptRepository;
import com.quizmaster.repository.QuizGroupAssignmentRepository;
import com.quizmaster.repository.QuizRepository;
import com.quizmaster.repository.StudentGroupMemberRepository;
import com.quizmaster.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Sends QUIZ_EXPIRING notifications to students who have an assigned quiz
 * closing within the next 24 hours and haven't completed it yet.
 *
 * Strategy: runs hourly, picks quizzes expiring in the (1h, 24h) window,
 * dedupes against existing QUIZ_EXPIRING notifications already sent for
 * that quiz to that student. Keeps the alert from spamming the same
 * person on every tick.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class QuizExpiryReminderScheduler {

    private final QuizRepository quizRepository;
    private final QuizGroupAssignmentRepository quizGroupAssignmentRepository;
    private final StudentGroupMemberRepository studentGroupMemberRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    private static final List<AttemptStatus> COMPLETED_STATUSES =
            List.of(AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED);

    @Scheduled(fixedDelay = 60 * 60 * 1000L) // hourly
    public void notifyExpiringQuizzes() {
        Instant now = Instant.now();
        Instant horizon = now.plus(Duration.ofHours(24));

        // PUBLISHED quizzes with an expiry inside the next 24h
        List<Quiz> expiringSoon = quizRepository
                .findByStatusAndDeletedAtIsNullAndExpiresAtBetween(
                        QuizStatus.PUBLISHED, now, horizon);
        if (expiringSoon.isEmpty()) return;

        log.info("QuizExpiryReminderScheduler: {} quiz(es) expiring within 24h", expiringSoon.size());

        for (Quiz quiz : expiringSoon) {
            long hoursLeft = Math.max(1,
                    Duration.between(now, quiz.getExpiresAt()).toHours());

            Set<Long> seen = new HashSet<>();
            try {
                List<QuizGroupAssignment> assignments =
                        quizGroupAssignmentRepository.findByQuizId(quiz.getId());

                for (QuizGroupAssignment qga : assignments) {
                    if (qga.getGroup() == null) continue;
                    List<StudentGroupMember> members =
                            studentGroupMemberRepository.findByGroupId(qga.getGroup().getId());
                    for (StudentGroupMember m : members) {
                        User student = m.getUser();
                        if (student == null) continue;
                        if (!seen.add(student.getId())) continue;

                        // Skip if the student already completed this quiz.
                        int completed = quizAttemptRepository
                                .countByStudentIdAndQuizIdAndStatusIn(
                                        student.getId(), quiz.getId(), COMPLETED_STATUSES);
                        if (completed > 0) continue;

                        // Skip if we already alerted this student for this quiz —
                        // referenceUuid is the quiz UUID, so we can look up
                        // prior QUIZ_EXPIRING rows directly.
                        boolean alreadyAlerted = notificationRepository
                                .existsByUserIdAndTypeAndReferenceUuid(
                                        student.getId(),
                                        NotificationType.QUIZ_EXPIRING,
                                        quiz.getUuid().toString());
                        if (alreadyAlerted) continue;

                        notificationService.sendQuizExpiringNotification(
                                student,
                                quiz.getTitle(),
                                quiz.getUuid().toString(),
                                hoursLeft);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to send QUIZ_EXPIRING notifications for quiz {}: {}",
                        quiz.getId(), e.getMessage());
            }
        }
    }
}
