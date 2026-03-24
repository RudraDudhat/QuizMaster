package com.quizmaster.service;

import com.quizmaster.dto.response.*;
import com.quizmaster.entity.Question;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.QuizAttempt;
import com.quizmaster.enums.AttemptStatus;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.enums.UserRole;
import com.quizmaster.exception.ResourceNotFoundException;
import com.quizmaster.mapper.AnalyticsMapper;
import com.quizmaster.mapper.AttemptMapper;
import com.quizmaster.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final List<AttemptStatus> COMPLETED_STATUSES =
            List.of(AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED);

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final UserRepository userRepository;
    private final AnalyticsMapper analyticsMapper;
    private final AttemptMapper attemptMapper;

    @Transactional(readOnly = true)
    public QuizAnalyticsResponse getQuizAnalytics(UUID quizUuid) {
        Quiz quiz = quizRepository.findByUuidWithTagsAndCategory(quizUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        return doGetQuizAnalytics(quiz.getId(), quiz.getUuid(), quiz.getTitle());
    }

    @Transactional(readOnly = true)
    private QuizAnalyticsResponse doGetQuizAnalytics(Long quizId, UUID quizUuid, String quizTitle) {

        // ── 1. Fetch all completed attempts directly from quiz_attempts table ──
        List<QuizAttempt> attempts = quizAttemptRepository.findAllByQuizIdAndStatusIn(quizId, COMPLETED_STATUSES);

        if (attempts.isEmpty()) {
            return analyticsMapper.toQuizAnalyticsResponse(
                    quizUuid, quizTitle,
                    0, 0,
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    0, 0,
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    buildScoreDistribution(Collections.emptyList()),
                    Collections.emptyList(),
                    0,
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }

        // ── 2. Compute aggregated stats from QuizAttempt entities ──
        int totalAttempts = attempts.size();
        int completedAttempts = totalAttempts; // all are already filtered by COMPLETED_STATUSES

        BigDecimal completionRate = BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);

        // Score stats
        List<BigDecimal> scores = attempts.stream()
                .map(QuizAttempt::getMarksObtained)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        BigDecimal avgScore = BigDecimal.ZERO;
        BigDecimal highestScore = BigDecimal.ZERO;
        BigDecimal lowestScore = BigDecimal.ZERO;

        if (!scores.isEmpty()) {
            avgScore = scores.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(scores.size()), 2, RoundingMode.HALF_UP);
            highestScore = scores.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            lowestScore = scores.stream().min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        }

        // Percentage stats
        List<BigDecimal> percentages = attempts.stream()
                .map(QuizAttempt::getPercentage)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        BigDecimal avgPercentage = BigDecimal.ZERO;
        if (!percentages.isEmpty()) {
            avgPercentage = percentages.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(percentages.size()), 2, RoundingMode.HALF_UP);
        }

        // Duration stats
        List<Long> durations = attempts.stream()
                .filter(a -> a.getSubmittedAt() != null && a.getStartedAt() != null)
                .map(a -> Duration.between(a.getStartedAt(), a.getSubmittedAt()).getSeconds())
                .collect(Collectors.toList());

        BigDecimal avgDuration = BigDecimal.ZERO;
        if (!durations.isEmpty()) {
            avgDuration = BigDecimal.valueOf(durations.stream().mapToLong(Long::longValue).average().orElse(0))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // Pass/Fail counts
        int passCount = (int) attempts.stream().filter(a -> Boolean.TRUE.equals(a.getIsPassed())).count();
        int failCount = completedAttempts - passCount;

        BigDecimal passRate = completedAttempts > 0
                ? BigDecimal.valueOf(passCount * 100.0 / completedAttempts).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // ── 3. Score distribution (10-point buckets) ──
        Map<String, Integer> scoreDistribution = buildScoreDistribution(attempts);

        // ── 4. Per-question accuracy from AttemptAnswer entities ──
        List<QuestionAccuracyResponse> accuracies = buildQuestionAccuracies(quizId);

        // ── 5. Anti-cheat summary ──
        int flaggedCount = (int) attempts.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsFlaggedSuspicious()))
                .count();
        BigDecimal avgTabSwitch = attempts.stream()
                .map(QuizAttempt::getTabSwitchCount)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .stream()
                .mapToObj(v -> BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP))
                .findFirst()
                .orElse(BigDecimal.ZERO);

        return analyticsMapper.toQuizAnalyticsResponse(
                quizUuid, quizTitle,
                totalAttempts, completedAttempts,
                completionRate, avgScore, highestScore, lowestScore,
                avgPercentage, avgDuration,
                passCount, failCount, passRate,
                scoreDistribution, accuracies,
                flaggedCount, avgTabSwitch);
    }

    // ─── Score distribution: 10-point buckets ───────────

    private Map<String, Integer> buildScoreDistribution(List<QuizAttempt> attempts) {
        Map<String, Integer> distribution = new LinkedHashMap<>();
        distribution.put("0-10", 0);
        distribution.put("11-20", 0);
        distribution.put("21-30", 0);
        distribution.put("31-40", 0);
        distribution.put("41-50", 0);
        distribution.put("51-60", 0);
        distribution.put("61-70", 0);
        distribution.put("71-80", 0);
        distribution.put("81-90", 0);
        distribution.put("91-100", 0);

        for (QuizAttempt a : attempts) {
            if (a.getPercentage() == null) continue;
            int pct = a.getPercentage().intValue();
            String bucket;
            if (pct <= 10) bucket = "0-10";
            else if (pct <= 20) bucket = "11-20";
            else if (pct <= 30) bucket = "21-30";
            else if (pct <= 40) bucket = "31-40";
            else if (pct <= 50) bucket = "41-50";
            else if (pct <= 60) bucket = "51-60";
            else if (pct <= 70) bucket = "61-70";
            else if (pct <= 80) bucket = "71-80";
            else if (pct <= 90) bucket = "81-90";
            else bucket = "91-100";
            distribution.merge(bucket, 1, Integer::sum);
        }
        return distribution;
    }

    // ─── Per-question accuracy from AttemptAnswer ─────

    private List<QuestionAccuracyResponse> buildQuestionAccuracies(Long quizId) {
        List<Object[]> rows = attemptAnswerRepository.findQuestionAccuracyByQuizId(quizId, COMPLETED_STATUSES);
        if (rows.isEmpty()) return Collections.emptyList();

        // Collect question IDs to load question text/type
        Set<Long> questionIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .collect(Collectors.toSet());
        Map<Long, Question> questionMap = new HashMap<>();
        questionRepository.findAllById(questionIds).forEach(q -> questionMap.put(q.getId(), q));

        List<QuestionAccuracyResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long questionId = ((Number) row[0]).longValue();
            long totalAnswers = row[1] != null ? ((Number) row[1]).longValue() : 0;
            long correctCount = row[2] != null ? ((Number) row[2]).longValue() : 0;
            long skippedCount = row[3] != null ? ((Number) row[3]).longValue() : 0;
            long hintUsedCount = row[4] != null ? ((Number) row[4]).longValue() : 0;
            double avgTime = row[5] != null ? ((Number) row[5]).doubleValue() : 0;

            BigDecimal accuracyPct = totalAnswers > 0
                    ? BigDecimal.valueOf(correctCount * 100.0 / totalAnswers).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            Question q = questionMap.get(questionId);

            QuestionAccuracyResponse resp = QuestionAccuracyResponse.builder()
                    .totalAnswers(totalAnswers)
                    .correctCount(correctCount)
                    .skippedCount(skippedCount)
                    .hintUsedCount(hintUsedCount)
                    .accuracyPct(accuracyPct)
                    .avgTimeSeconds(BigDecimal.valueOf(avgTime).setScale(2, RoundingMode.HALF_UP))
                    .build();

            if (q != null) {
                resp.setQuestionText(q.getQuestionText());
                resp.setQuestionType(q.getQuestionType().name());
                resp.setQuestionUuid(q.getUuid());
            }

            result.add(resp);
        }
        return result;
    }

    // ─── Admin Dashboard ─────────────────────────────────

    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard() {
        int totalStudents = userRepository
                .countByRoleAndIsActiveTrueAndDeletedAtIsNull(UserRole.STUDENT);
        int totalQuizzes = quizRepository.countByDeletedAtIsNull();
        int totalAttempts = quizAttemptRepository.countByStatusIn(COMPLETED_STATUSES);
        int activeQuizzes = quizRepository.countByStatusAndDeletedAtIsNull(QuizStatus.PUBLISHED);

        java.time.Instant startOfDay = LocalDate.now(ZoneOffset.UTC)
                .atStartOfDay(ZoneOffset.UTC)
                .toInstant();
        int attemptsToday = quizAttemptRepository
                .countByStatusInAndSubmittedAtAfter(COMPLETED_STATUSES, startOfDay);

        BigDecimal platformPassRate;
        if (totalAttempts == 0) {
            platformPassRate = BigDecimal.ZERO;
        } else {
            int passedCount = quizAttemptRepository.countPassedByStatusIn(COMPLETED_STATUSES);
            platformPassRate = BigDecimal.valueOf(passedCount * 100.0 / totalAttempts)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // Recent 10 attempts across all students
        List<AttemptHistoryResponse> recentAttempts = quizAttemptRepository
                .findByStatusInOrderBySubmittedAtDesc(COMPLETED_STATUSES, PageRequest.of(0, 10))
                .stream()
                .map(attemptMapper::toHistoryResponse)
                .collect(Collectors.toList());

        // Top 5 quizzes by attempt count
        List<QuizSummaryDto> topQuizzes = new ArrayList<>();
        List<Object[]> rows = quizAttemptRepository
                .findTopQuizzesByAttemptCount(COMPLETED_STATUSES, PageRequest.of(0, 5));
        for (Object[] row : rows) {
            Long quizId = ((Number) row[0]).longValue();
            int attemptCount = row[1] != null ? ((Number) row[1]).intValue() : 0;
            BigDecimal avgScore = row[2] != null
                    ? BigDecimal.valueOf(((Number) row[2]).doubleValue()).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            int passCount = row[3] != null ? ((Number) row[3]).intValue() : 0;
            BigDecimal passRate = attemptCount > 0
                    ? BigDecimal.valueOf(passCount * 100.0 / attemptCount)
                            .setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            quizRepository.findById(quizId).ifPresent(quiz ->
                topQuizzes.add(QuizSummaryDto.builder()
                        .quizUuid(quiz.getUuid().toString())
                        .title(quiz.getTitle())
                        .attemptCount(attemptCount)
                        .avgScore(avgScore)
                        .passRate(passRate)
                        .status(quiz.getStatus().name())
                        .build())
            );
        }

        return AdminDashboardResponse.builder()
                .totalStudents(totalStudents)
                .totalQuizzes(totalQuizzes)
                .totalAttempts(totalAttempts)
                .activeQuizzes(activeQuizzes)
                .attemptsToday(attemptsToday)
                .platformPassRate(platformPassRate)
                .recentAttempts(recentAttempts)
                .topQuizzes(topQuizzes)
                .build();
    }

    // ─── Student performance table ───────────────────────

    @Transactional(readOnly = true)
    public Page<StudentPerformanceRow> getAllStudentsPerformance(Pageable pageable) {
        return quizAttemptRepository
                .findStudentPerformanceStats(COMPLETED_STATUSES, pageable)
                .map(p -> {
                    int total = p.getTotalAttempts();
                    int pass  = p.getPassCount();

                    BigDecimal avgScore = p.getAverageScore() != null
                            ? p.getAverageScore().setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    BigDecimal bestScore = p.getBestScore() != null
                            ? p.getBestScore().setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    BigDecimal passRate = total > 0
                            ? BigDecimal.valueOf(pass * 100.0 / total)
                                    .setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;

                    return StudentPerformanceRow.builder()
                            .studentUuid(p.getStudentUuid())
                            .fullName(p.getFullName())
                            .email(p.getEmail())
                            .totalAttempts(total)
                            .passCount(pass)
                            .failCount(p.getFailCount())
                            .averageScore(avgScore)
                            .bestScore(bestScore)
                            .passRate(passRate)
                            .lastAttemptAt(p.getLastAttemptAt())
                            .build();
                });
    }

    // ─── Per-quiz attempt list ────────────────────────────

    @Transactional(readOnly = true)
    public Page<QuizAttemptListResponse> getAttemptsForQuiz(String quizUuidStr, Pageable pageable) {
        UUID quizUuid;
        try {
            quizUuid = UUID.fromString(quizUuidStr);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Quiz not found");
        }

        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(quizUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        return quizAttemptRepository
                .findByQuizIdAndStatusIn(quiz.getId(), COMPLETED_STATUSES, pageable)
                .map(attempt -> {
                    Long timeTaken = null;
                    if (attempt.getSubmittedAt() != null && attempt.getStartedAt() != null) {
                        timeTaken = Duration.between(attempt.getStartedAt(),
                                attempt.getSubmittedAt()).getSeconds();
                    }
                    return QuizAttemptListResponse.builder()
                            .attemptUuid(attempt.getUuid().toString())
                            .studentUuid(attempt.getStudent().getUuid().toString())
                            .studentName(attempt.getStudent().getFullName())
                            .studentEmail(attempt.getStudent().getEmail())
                            .attemptNumber(attempt.getAttemptNumber())
                            .status(attempt.getStatus().name())
                            .marksObtained(attempt.getMarksObtained())
                            .totalMarksPossible(attempt.getTotalMarksPossible())
                            .percentage(attempt.getPercentage())
                            .isPassed(attempt.getIsPassed())
                            .timeTakenSeconds(timeTaken)
                            .submittedAt(attempt.getSubmittedAt())
                            .isFlaggedSuspicious(attempt.getIsFlaggedSuspicious())
                            .tabSwitchCount(attempt.getTabSwitchCount())
                            .build();
                });
    }
}
