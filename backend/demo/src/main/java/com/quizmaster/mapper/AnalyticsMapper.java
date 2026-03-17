package com.quizmaster.mapper;

import com.quizmaster.dto.response.QuestionAccuracyResponse;
import com.quizmaster.dto.response.QuizAnalyticsResponse;
import com.quizmaster.entity.QuestionAccuracyView;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface AnalyticsMapper {

    // ─── Entity → DTO ───────────────────────────────────

    @Mapping(source = "accuracyPct", target = "accuracyPct")
    @Mapping(source = "avgTimeSeconds", target = "avgTimeSeconds")
    @Mapping(target = "questionText", ignore = true) // enriched in service
    @Mapping(target = "questionType", ignore = true) // enriched in service
    @Mapping(target = "questionUuid", ignore = true) // enriched in service
    QuestionAccuracyResponse toQuestionAccuracyResponse(QuestionAccuracyView view);

    List<QuestionAccuracyResponse> toQuestionAccuracyResponseList(List<QuestionAccuracyView> views);

    // ─── Assemble full analytics response ───────────────

    default QuizAnalyticsResponse toQuizAnalyticsResponse(
            UUID quizId,
            String quizTitle,
            int totalAttempts,
            int completedAttempts,
            BigDecimal completionRate,
            BigDecimal averageScore,
            BigDecimal highestScore,
            BigDecimal lowestScore,
            BigDecimal averagePercentage,
            BigDecimal averageDurationSeconds,
            int passCount,
            int failCount,
            BigDecimal passRate,
            Map<String, Integer> scoreDistribution,
            List<QuestionAccuracyResponse> questionAccuracies,
            int flaggedSuspiciousCount,
            BigDecimal avgTabSwitchCount) {
        return QuizAnalyticsResponse.builder()
                .quizId(quizId)
                .quizTitle(quizTitle)
                .totalAttempts(totalAttempts)
                .completedAttempts(completedAttempts)
                .completionRate(completionRate)
                .averageScore(averageScore)
                .highestScore(highestScore)
                .lowestScore(lowestScore)
                .averagePercentage(averagePercentage)
                .averageDurationSeconds(averageDurationSeconds)
                .passCount(passCount)
                .failCount(failCount)
                .passRate(passRate)
                .scoreDistribution(scoreDistribution)
                .questionAccuracies(questionAccuracies)
                .flaggedSuspiciousCount(flaggedSuspiciousCount)
                .avgTabSwitchCount(avgTabSwitchCount)
                .build();
    }
}
