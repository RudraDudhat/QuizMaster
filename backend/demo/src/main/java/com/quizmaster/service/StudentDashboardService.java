package com.quizmaster.service;

import com.quizmaster.dto.response.AttemptHistoryResponse;
import com.quizmaster.dto.response.AvailableQuizResponse;
import com.quizmaster.dto.response.StudentDashboardResponse;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.QuizAttempt;
import com.quizmaster.entity.StudentGroupMember;
import com.quizmaster.entity.User;
import com.quizmaster.enums.AttemptStatus;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.exception.ResourceNotFoundException;
import com.quizmaster.mapper.AttemptMapper;
import com.quizmaster.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentDashboardService {

    private static final List<AttemptStatus> COMPLETED_STATUSES =
            List.of(AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED);

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizGroupAssignmentRepository quizGroupAssignmentRepository;
    private final StudentGroupMemberRepository studentGroupMemberRepository;
    private final AttemptMapper attemptMapper;

    // ─── Public API ──────────────────────────────────────

    public Page<AvailableQuizResponse> getAvailableQuizzes(String studentEmail, Pageable pageable) {
        User student = getStudentByEmail(studentEmail);
        List<Long> groupIds = getGroupIds(student.getId());

        Page<Quiz> quizPage = quizRepository.findAvailableQuizzes(Instant.now(), pageable);

        List<AvailableQuizResponse> responses = quizPage.getContent().stream()
                .filter(quiz -> isQuizAccessible(quiz.getId(), groupIds))
                .map(quiz -> buildQuizResponse(quiz, student.getId(), Instant.now()))
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, quizPage.getTotalElements());
    }

    public AvailableQuizResponse getQuizDetail(String quizUuid, String studentEmail) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(quizUuid))
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new BadRequestException("Quiz is not available");
        }

        User student = getStudentByEmail(studentEmail);
        List<Long> groupIds = getGroupIds(student.getId());

        if (!isQuizAccessible(quiz.getId(), groupIds)) {
            throw new BadRequestException("Quiz not accessible");
        }

        return buildQuizResponse(quiz, student.getId(), Instant.now());
    }

    public StudentDashboardResponse getStudentDashboard(String studentEmail) {
        User student = getStudentByEmail(studentEmail);
        Long studentId = student.getId();

        int totalQuizzesTaken = quizAttemptRepository
                .countByStudentIdAndStatusIn(studentId, COMPLETED_STATUSES);

        int totalQuizzesPassed = quizAttemptRepository
                .countByStudentIdAndIsPassedAndStatusIn(studentId, Boolean.TRUE, COMPLETED_STATUSES);

        BigDecimal averageScore = quizAttemptRepository
                .findAverageScoreByStudentId(studentId, COMPLETED_STATUSES)
                .orElse(BigDecimal.ZERO);

        BigDecimal bestScore = quizAttemptRepository
                .findBestScoreByStudentId(studentId, COMPLETED_STATUSES)
                .orElse(BigDecimal.ZERO);

        BigDecimal passRate;
        if (totalQuizzesTaken == 0) {
            passRate = BigDecimal.ZERO;
        } else {
            passRate = BigDecimal.valueOf(totalQuizzesPassed)
                    .divide(BigDecimal.valueOf(totalQuizzesTaken), 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // Recent attempts — last 5
        Page<QuizAttempt> recentPage = quizAttemptRepository
                .findByStudentIdAndStatusInOrderBySubmittedAtDesc(
                        studentId, COMPLETED_STATUSES, PageRequest.of(0, 5));
        List<AttemptHistoryResponse> recentAttempts = recentPage.getContent().stream()
                .map(attemptMapper::toHistoryResponse)
                .collect(Collectors.toList());

        // Upcoming quizzes — next 3 by expiresAt ASC, enriched
        Instant now = Instant.now();
        List<Long> groupIds = getGroupIds(studentId);
        List<AvailableQuizResponse> upcomingQuizzes = quizRepository
                .findUpcomingQuizzes(now, PageRequest.of(0, 3))
                .stream()
                .filter(quiz -> isQuizAccessible(quiz.getId(), groupIds))
                .map(quiz -> buildQuizResponse(quiz, studentId, now))
                .collect(Collectors.toList());

        return StudentDashboardResponse.builder()
                .totalQuizzesTaken(totalQuizzesTaken)
                .totalQuizzesPassed(totalQuizzesPassed)
                .averageScore(averageScore)
                .bestScore(bestScore)
                .passRate(passRate)
                .currentStreak(student.getStreakDays())
                .xpPoints(student.getXpPoints())
                .recentAttempts(recentAttempts)
                .upcomingQuizzes(upcomingQuizzes)
                .build();
    }

    // ─── Private helpers ─────────────────────────────────

    /**
     * Builds an AvailableQuizResponse with full enrichment.
     * For detail/dashboard calls, status logic also includes UPCOMING and EXPIRED.
     */
    private AvailableQuizResponse buildQuizResponse(Quiz quiz, Long studentId, Instant now) {
        Long quizId = quiz.getId();

        // Attempt counts
        int attemptsUsed = quizAttemptRepository
                .countByStudentIdAndQuizIdAndStatusIn(studentId, quizId, COMPLETED_STATUSES);

        int attemptsRemaining;
        if (quiz.getMaxAttempts() == 0) {
            attemptsRemaining = -1; // unlimited
        } else {
            attemptsRemaining = quiz.getMaxAttempts() - attemptsUsed;
        }

        // Best attempt scores
        Optional<QuizAttempt> bestAttempt = quizAttemptRepository
                .findTopByStudentIdAndQuizIdAndStatusInOrderByMarksObtainedDesc(
                        studentId, quizId, COMPLETED_STATUSES);

        BigDecimal studentBestScore = bestAttempt.map(QuizAttempt::getMarksObtained).orElse(null);
        BigDecimal studentBestPercentage = bestAttempt.map(QuizAttempt::getPercentage).orElse(null);

        // isPassed: null = no attempts, true = at least one passing attempt, false = attempts but none passed
        Boolean isPassed;
        if (bestAttempt.isEmpty()) {
            isPassed = null;
        } else {
            // Best-scoring attempt: if it passed, student has passed; if not, no attempt passed
            isPassed = Boolean.TRUE.equals(bestAttempt.get().getIsPassed()) ? Boolean.TRUE : Boolean.FALSE;
        }

        // Question count
        int questionCount = (int) quizQuestionRepository.countByQuizId(quizId);

        // Quiz status
        String quizStatus = computeQuizStatus(quiz, attemptsRemaining, isPassed, now);

        return AvailableQuizResponse.builder()
                .uuid(quiz.getUuid().toString())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .categoryName(quiz.getCategory() != null ? quiz.getCategory().getName() : null)
                .difficulty(quiz.getDifficulty().name())
                .quizType(quiz.getQuizType().name())
                .timeLimitSeconds(quiz.getTimeLimitSeconds())
                .totalMarks(quiz.getTotalMarks())
                .passMarks(quiz.getPassMarks())
                .questionCount(questionCount)
                .maxAttempts(quiz.getMaxAttempts())
                .attemptsUsed(attemptsUsed)
                .attemptsRemaining(attemptsRemaining)
                .startsAt(quiz.getStartsAt())
                .expiresAt(quiz.getExpiresAt())
                .quizStatus(quizStatus)
                .studentBestScore(studentBestScore)
                .studentBestPercentage(studentBestPercentage)
                .isPassed(isPassed)
                .build();
    }

    /**
     * Computes the quiz status string from the current state.
     * Handles UPCOMING and EXPIRED in addition to the availability states.
     */
    private String computeQuizStatus(Quiz quiz, int attemptsRemaining, Boolean isPassed, Instant now) {
        if (quiz.getStartsAt() != null && quiz.getStartsAt().isAfter(now)) {
            return "UPCOMING";
        }
        if (quiz.getExpiresAt() != null && quiz.getExpiresAt().isBefore(now)) {
            return "EXPIRED";
        }
        if (attemptsRemaining == 0) {
            return "MAX_ATTEMPTS_REACHED";
        }
        if (Boolean.TRUE.equals(isPassed)) {
            return "COMPLETED";
        }
        return "AVAILABLE";
    }

    /**
     * Returns true if the quiz has no group restrictions, or if the student belongs
     * to at least one group that is assigned to the quiz.
     */
    private boolean isQuizAccessible(Long quizId, List<Long> studentGroupIds) {
        if (!quizGroupAssignmentRepository.existsByQuizId(quizId)) {
            return true; // No group restrictions — open to all
        }
        return studentGroupIds.stream()
                .anyMatch(gId -> quizGroupAssignmentRepository.existsByQuizIdAndGroupId(quizId, gId));
    }

    private User getStudentByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
    }

    private List<Long> getGroupIds(Long studentId) {
        return studentGroupMemberRepository.findByUserId(studentId)
                .stream()
                .map(m -> m.getGroup().getId())
                .collect(Collectors.toList());
    }
}
