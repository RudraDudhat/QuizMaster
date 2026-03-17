package com.quizmaster.dto.request;

import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuizType;
import com.quizmaster.enums.TimerMode;
import jakarta.validation.constraints.*;
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
public class CreateQuizRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @Size(max = 10000, message = "Instructions must not exceed 10000 characters")
    private String instructions;

    private UUID categoryUuid;

    private QuizType quizType;
    private DifficultyLevel difficulty;

    // Timer
    private TimerMode timerMode;

    @Min(value = 0, message = "Time limit cannot be negative")
    @Max(value = 86400, message = "Time limit cannot exceed 24 hours")
    private Integer timeLimitSeconds;

    @Min(value = 0, message = "Per-question time cannot be negative")
    @Max(value = 3600, message = "Per-question time cannot exceed 1 hour")
    private Integer perQuestionSeconds;

    @Min(value = 0, message = "Grace period cannot be negative")
    @Max(value = 3600, message = "Grace period cannot exceed 1 hour")
    private Integer gracePeriodSeconds;

    // Scoring
    @DecimalMin(value = "0.0", message = "Total marks cannot be negative")
    @DecimalMax(value = "99999.99", message = "Total marks exceeds maximum")
    private BigDecimal totalMarks;

    @DecimalMin(value = "0.0", message = "Pass marks cannot be negative")
    private BigDecimal passMarks;

    @DecimalMin(value = "0.0", message = "Negative marking factor cannot be negative")
    @DecimalMax(value = "1.0", message = "Negative marking factor cannot exceed 1.0")
    private BigDecimal negativeMarkingFactor;

    // Attempt rules
    @Min(value = 1, message = "Max attempts must be at least 1")
    @Max(value = 100, message = "Max attempts cannot exceed 100")
    private Integer maxAttempts;

    @Min(value = 0, message = "Cooldown hours cannot be negative")
    @Max(value = 720, message = "Cooldown cannot exceed 30 days")
    private Integer cooldownHours;

    // Access control
    @Size(max = 50, message = "Access code must not exceed 50 characters")
    private String accessCode;

    @FutureOrPresent(message = "Start time must be in the present or future")
    private Instant startsAt;

    private Instant expiresAt;

    // Question pool
    @Min(value = 1, message = "Question pool size must be at least 1")
    private Integer questionPoolSize;

    @Min(value = 1, message = "Questions to serve must be at least 1")
    private Integer questionsToServe;

    private Boolean shuffleQuestions;
    private Boolean shuffleOptions;
    private Boolean allowBackNavigation;
    private Boolean showResultImmediately;
    private Boolean showCorrectAnswers;
    private Boolean showLeaderboard;

    // Display
    @Size(max = 20, message = "Color label must not exceed 20 characters")
    private String colorLabel;

    private Boolean isPinned;

    @Min(value = 0, message = "Display order cannot be negative")
    private Integer displayOrder;

    // Tags (tag UUIDs to attach)
    private Set<UUID> tagUuids;
}
