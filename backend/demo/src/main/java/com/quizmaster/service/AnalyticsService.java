package com.quizmaster.service;

import com.quizmaster.dto.projection.StudentPerformanceProjection;
import com.quizmaster.dto.response.*;
import com.quizmaster.entity.AttemptSummaryView;
import com.quizmaster.entity.Question;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.QuizAttempt;
import com.quizmaster.entity.QuestionAccuracyView;
import com.quizmaster.enums.AttemptStatus;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.enums.UserRole;
import com.quizmaster.exception.BadRequestException;
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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final List<AttemptStatus> COMPLETED_STATUSES =
            List.of(AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED);

    private final AttemptSummaryViewRepository attemptSummaryRepo;
    private final QuestionAccuracyViewRepository questionAccuracyRepo;
    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;
    private final AnalyticsMapper analyticsMapper;
    private final AttemptMapper attemptMapper;

    @Transactional(readOnly = true)
    public QuizAnalyticsResponse getQuizAnalytics(UUID quizUuid) {
        Quiz quiz = quizRepository.findByUuidWithTagsAndCategory(quizUuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        return doGetQuizAnalytics(quiz.getId(), quiz.getUuid());
    }

    @Transactional(readOnly = true)
    private QuizAnalyticsResponse doGetQuizAnalytics(Long quizId, UUID quizUuid) {
        List<AttemptSummaryView> summaries = attemptSummaryRepo.findByQuizId(quizId);
        if (summaries.isEmpty()) {
            throw new BadRequestException("No attempts found for quiz ID: " + quizId);
        }

        // --- Build question accuracies via mapper ---
        List<QuestionAccuracyView> accuracyViews = questionAccuracyRepo.findByQuizId(quizId);
        List<QuestionAccuracyResponse> accuracies = analyticsMapper.toQuestionAccuracyResponseList(accuracyViews);

        // Enrich with question text and type
        Set<Long> questionIds = accuracyViews.stream()
                .map(QuestionAccuracyView::getQuestionId)
                .collect(Collectors.toSet());
        Map<Long, Question> questionMap = new HashMap<>();
        questionRepository.findAllById(questionIds).forEach(q -> questionMap.put(q.getId(), q));

        for (int i = 0; i < accuracies.size(); i++) {
            QuestionAccuracyResponse resp = accuracies.get(i);
            Question q = questionMap.get(accuracyViews.get(i).getQuestionId());
            if (q != null) {
                resp.setQuestionText(q.getQuestionText());
                resp.setQuestionType(q.getQuestionType().name());
                resp.setQuestionUuid(q.getUuid());
            }
        }

        // --- Compute aggregated stats ---
        String quizTitle = summaries.get(0).getQuizTitle();
        int totalAttempts = summaries.size();

        List<AttemptSummaryView> completed = summaries.stream()
                .filter(s -> "SUBMITTED".equals(s.getStatus()) || "TIMED_OUT".equals(s.getStatus()))
                .collect(Collectors.toList());

        int completedAttempts = completed.size();
        BigDecimal completionRate = totalAttempts > 0
                ? BigDecimal.valueOf(completedAttempts * 100.0 / totalAttempts).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Score stats from completed attempts
        BigDecimal avgScore = BigDecimal.ZERO;
        BigDecimal highestScore = BigDecimal.ZERO;
        BigDecimal lowestScore = BigDecimal.ZERO;
        BigDecimal avgPercentage = BigDecimal.ZERO;
        BigDecimal avgDuration = BigDecimal.ZERO;
        int passCount = 0;
        int failCount = 0;

        if (!completed.isEmpty()) {
            List<BigDecimal> scores = completed.stream()
                    .map(AttemptSummaryView::getMarksObtained)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (!scores.isEmpty()) {
                avgScore = scores.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(scores.size()), 2, RoundingMode.HALF_UP);
                highestScore = scores.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
                lowestScore = scores.stream().min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            }

            List<BigDecimal> percentages = completed.stream()
                    .map(AttemptSummaryView::getPercentage)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (!percentages.isEmpty()) {
                avgPercentage = percentages.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(percentages.size()), 2, RoundingMode.HALF_UP);
            }

            List<Integer> durations = completed.stream()
                    .map(AttemptSummaryView::getDurationSeconds)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (!durations.isEmpty()) {
                avgDuration = BigDecimal.valueOf(durations.stream().mapToInt(Integer::intValue).average().orElse(0))
                        .setScale(2, RoundingMode.HALF_UP);
            }

            passCount = (int) completed.stream().filter(s -> Boolean.TRUE.equals(s.getIsPassed())).count();
            failCount = completedAttempts - passCount;
        }

        BigDecimal passRate = completedAttempts > 0
                ? BigDecimal.valueOf(passCount * 100.0 / completedAttempts).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // --- Score distribution (10-point buckets) ---
        Map<String, Integer> scoreDistribution = buildScoreDistribution(completed);

        // --- Anti-cheat summary ---
        int flaggedCount = (int) summaries.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsFlaggedSuspicious()))
                .count();
        BigDecimal avgTabSwitch = summaries.stream()
                .map(AttemptSummaryView::getTabSwitchCount)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .stream()
                .mapToObj(v -> BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP))
                .findFirst()
                .orElse(BigDecimal.ZERO);

        return analyticsMapper.toQuizAnalyticsResponse(
                quizUuid,
                quizTitle,
                totalAttempts,
                completedAttempts,
                completionRate,
                avgScore,
                highestScore,
                lowestScore,
                avgPercentage,
                avgDuration,
                passCount,
                failCount,
                passRate,
                scoreDistribution,
                accuracies,
                flaggedCount,
                avgTabSwitch);
    }

    // ─── Score distribution: 10-point buckets ───────────

    private Map<String, Integer> buildScoreDistribution(List<AttemptSummaryView> completed) {
        // Use a LinkedHashMap to maintain order
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

        for (AttemptSummaryView s : completed) {
            if (s.getPercentage() == null)
                continue;
            int pct = s.getPercentage().intValue();
            String bucket;
            if (pct <= 10)
                bucket = "0-10";
            else if (pct <= 20)
                bucket = "11-20";
            else if (pct <= 30)
                bucket = "21-30";
            else if (pct <= 40)
                bucket = "31-40";
            else if (pct <= 50)
                bucket = "41-50";
            else if (pct <= 60)
                bucket = "51-60";
            else if (pct <= 70)
                bucket = "61-70";
            else if (pct <= 80)
                bucket = "71-80";
            else if (pct <= 90)
                bucket = "81-90";
            else
                bucket = "91-100";
            distribution.merge(bucket, 1, Integer::sum);
        }
        return distribution;
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
            Long quizId = (Long) row[0];
            int attemptCount = ((Long) row[1]).intValue();
            BigDecimal avgScore = row[2] != null
                    ? ((BigDecimal) row[2]).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            int passCount = ((Long) row[3]).intValue();
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
