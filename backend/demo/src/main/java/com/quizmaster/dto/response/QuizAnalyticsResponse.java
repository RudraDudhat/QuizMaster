package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnalyticsResponse {

    private UUID quizId;
    private String quizTitle;

    // --- Summary stats ---
    private Integer totalAttempts;
    private Integer completedAttempts;
    private BigDecimal completionRate; // % of submitted/total
    private BigDecimal averageScore;
    private BigDecimal highestScore;
    private BigDecimal lowestScore;
    private BigDecimal averagePercentage;
    private BigDecimal averageDurationSeconds;
    private Integer passCount;
    private Integer failCount;
    private BigDecimal passRate;

    // --- Score distribution (e.g. "0-10": 5, "11-20": 3, ...) ---
    private Map<String, Integer> scoreDistribution;

    // --- Per-question accuracy ---
    private List<QuestionAccuracyResponse> questionAccuracies;

    // --- Anti-cheat summary ---
    private Integer flaggedSuspiciousCount;
    private BigDecimal avgTabSwitchCount;
}
