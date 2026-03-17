package com.quizmaster.service;

import com.quizmaster.dto.request.ResetAttemptsRequest;
import com.quizmaster.dto.request.UpdateStudentStatusRequest;
import com.quizmaster.dto.response.*;
import com.quizmaster.entity.*;
import com.quizmaster.enums.AttemptStatus;
import com.quizmaster.enums.NotificationType;
import com.quizmaster.enums.UserRole;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.exception.ResourceNotFoundException;
import com.quizmaster.mapper.AdminStudentMapper;
import com.quizmaster.mapper.AttemptMapper;
import com.quizmaster.mapper.StudentGroupMapper;
import com.quizmaster.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminStudentService {

    private static final List<AttemptStatus> COMPLETED_STATUSES =
            List.of(AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED);

    private final UserRepository userRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final StudentGroupMemberRepository studentGroupMemberRepository;
    private final NotificationService notificationService;
    private final AdminStudentMapper adminStudentMapper;
    private final AttemptMapper attemptMapper;
    private final StudentGroupMapper studentGroupMapper;

    // ─── getAllStudents ──────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminStudentListResponse> getAllStudents(Pageable pageable, String keyword) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;
        return userRepository.findStudentsByKeyword(kw, pageable)
                .map(this::enrichWithStats);
    }

    // ─── getStudentDetail ────────────────────────────────

    @Transactional(readOnly = true)
    public AdminStudentDetailResponse getStudentDetail(String userUuid) {
        User user = findStudentByUuidOrThrow(userUuid);
        Long userId = user.getId();

        AdminStudentListResponse base = enrichWithStats(user);

        // Last 10 completed attempts
        List<AttemptHistoryResponse> recentAttempts =
                quizAttemptRepository.findByStudentIdAndStatusInOrderBySubmittedAtDesc(
                                userId, COMPLETED_STATUSES, PageRequest.of(0, 10))
                        .stream()
                        .map(attemptMapper::toHistoryResponse)
                        .collect(Collectors.toList());

        // Group memberships (skip soft-deleted groups)
        List<GroupResponse> groupMemberships = studentGroupMemberRepository.findByUserId(userId)
                .stream()
                .map(StudentGroupMember::getGroup)
                .filter(g -> g.getDeletedAt() == null)
                .map(group -> {
                    int count = studentGroupMemberRepository.countByGroupId(group.getId());
                    return studentGroupMapper.toResponse(group, count);
                })
                .collect(Collectors.toList());

        return adminStudentMapper.toDetailResponse(user, base.getTotalAttempts(),
                base.getAverageScore(), base.getPassRate(), recentAttempts, groupMemberships);
    }

    // ─── suspendStudent ──────────────────────────────────

    @Transactional
    public AdminStudentListResponse suspendStudent(String userUuid,
            UpdateStudentStatusRequest request) {
        User user = findStudentByUuidOrThrow(userUuid);
        user.setIsActive(request.getIsActive());

        if (Boolean.FALSE.equals(request.getIsActive())) {
            // Revoke all active sessions
            refreshTokenRepository.revokeAllByUserId(user.getId());

            String reason = request.getReason();
            String body = reason != null
                    ? "Your account has been suspended. Reason: " + reason
                    : "Your account has been suspended by an administrator.";

            notificationService.sendNotification(
                    user,
                    NotificationType.ADMIN_MESSAGE,
                    "Account Suspended",
                    body,
                    null, null, null);
        } else {
            notificationService.sendNotification(
                    user,
                    NotificationType.ADMIN_MESSAGE,
                    "Account Reinstated",
                    "Your account has been reinstated. You can now log in and take quizzes.",
                    null, null, null);
        }

        userRepository.save(user);
        log.info("Student {} active status set to {} by admin", user.getUuid(), request.getIsActive());
        return enrichWithStats(user);
    }

    // ─── resetAttempts ───────────────────────────────────

    @Transactional
    public ResetAttemptsResponse resetAttempts(String userUuid, ResetAttemptsRequest request) {
        User user = findStudentByUuidOrThrow(userUuid);

        UUID quizUuid;
        try {
            quizUuid = UUID.fromString(request.getQuizUuid());
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Quiz not found");
        }

        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(quizUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdAndQuizIdAndStatusIn(
                user.getId(),
                quiz.getId(),
                List.of(AttemptStatus.IN_PROGRESS, AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED));

        attempts.forEach(a -> {
            a.setStatus(AttemptStatus.INVALIDATED);
            a.setInvalidationReason("Reset by admin");
        });
        quizAttemptRepository.saveAll(attempts);

        int resetCount = attempts.size();

        notificationService.sendNotification(
                user,
                NotificationType.ATTEMPT_RESET,
                "Quiz Attempts Reset",
                "Your " + resetCount + " attempt(s) for \"" + quiz.getTitle() +
                "\" have been reset by an administrator. You may now retake the quiz.",
                "/quizzes/" + quiz.getUuid(),
                String.valueOf(quiz.getId()),
                "QUIZ");

        log.info("Admin reset {} attempt(s) for student {} on quiz {}", resetCount,
                user.getUuid(), quiz.getUuid());

        return ResetAttemptsResponse.builder()
                .studentUuid(user.getUuid().toString())
                .quizUuid(quiz.getUuid().toString())
                .quizTitle(quiz.getTitle())
                .resetCount(resetCount)
                .message(resetCount + " attempt(s) invalidated successfully")
                .build();
    }

    // ─── Private helpers ─────────────────────────────────

    /**
     * Builds AdminStudentListResponse by computing stats from the DB.
     * Used both for list and detail responses.
     */
    private AdminStudentListResponse enrichWithStats(User student) {
        Long studentId = student.getId();

        int totalAttempts = quizAttemptRepository.countByStudentIdAndStatusIn(
                studentId, COMPLETED_STATUSES);

        BigDecimal averageScore;
        BigDecimal passRate;

        if (totalAttempts == 0) {
            averageScore = BigDecimal.ZERO;
            passRate = BigDecimal.ZERO;
        } else {
            averageScore = quizAttemptRepository
                    .findAverageScoreByStudentId(studentId, COMPLETED_STATUSES)
                    .orElse(BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);

            int passedCount = quizAttemptRepository.countByStudentIdAndIsPassedAndStatusIn(
                    studentId, true, COMPLETED_STATUSES);

            passRate = BigDecimal.valueOf(passedCount * 100.0 / totalAttempts)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return adminStudentMapper.toListResponse(student, totalAttempts, averageScore, passRate);
    }

    /** Lookup by UUID string + verify role is STUDENT. */
    private User findStudentByUuidOrThrow(String userUuid) {
        UUID parsedUuid;
        try {
            parsedUuid = UUID.fromString(userUuid);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Student not found");
        }

        User user = userRepository.findByUuidAndDeletedAtIsNull(parsedUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (user.getRole() != UserRole.STUDENT) {
            throw new BadRequestException("User is not a student");
        }
        return user;
    }
}
