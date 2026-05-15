package com.quizmaster.dto.response;

import com.quizmaster.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {

    private UUID uuid;
    private String title;
    private String description;
    private String instructions;

    // Category
    private UUID categoryUuid;
    private String categoryName;

    // Creator
    private UUID createdByUuid;
    private String createdByName;

    // Enums
    private QuizStatus status;
    private QuizType quizType;
    private DifficultyLevel difficulty;

    // Timer
    private TimerMode timerMode;
    private Integer timeLimitSeconds;
    private Integer perQuestionSeconds;
    private Integer gracePeriodSeconds;

    // Scoring
    private BigDecimal totalMarks;
    private BigDecimal passMarks;
    private BigDecimal negativeMarkingFactor;

    // Attempt rules
    private Integer maxAttempts;
    private Integer cooldownHours;

    // Access control
    private String accessCode;
    private Instant startsAt;
    private Instant expiresAt;

    // Question pool
    private Integer questionPoolSize;
    private Integer questionsToServe;
    /** Number of questions currently linked to this quiz (via QuizQuestion). */
    private Long questionCount;
    private Boolean shuffleQuestions;
    private Boolean shuffleOptions;
    private Boolean allowBackNavigation;
    private Boolean showResultImmediately;
    private Boolean showCorrectAnswers;
    private Boolean showLeaderboard;

    // Display
    private String colorLabel;
    private Boolean isPinned;
    private Integer displayOrder;
    private Integer version;

    // Tags
    private Set<String> tags;

    // Assigned student groups
    private Set<AssignedGroupSummary> assignedGroups;

    // Timestamps
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignedGroupSummary {
        private String uuid;
        private String name;
    }
}
