package com.quizmaster.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AvailableQuizResponse {

    /** UUID string — used in all frontend URLs */
    private String uuid;

    private String title;

    private String description;

    private String categoryName;

    private String difficulty;

    private String quizType;

    private Integer timeLimitSeconds;

    private BigDecimal totalMarks;

    private BigDecimal passMarks;

    private Integer questionCount;

    /** 0 = unlimited */
    private Integer maxAttempts;

    private Integer attemptsUsed;

    /** -1 = unlimited, 0 = none left */
    private Integer attemptsRemaining;

    private Instant startsAt;

    private Instant expiresAt;

    /**
     * One of: AVAILABLE, UPCOMING, EXPIRED, COMPLETED, MAX_ATTEMPTS_REACHED
     */
    private String quizStatus;

    /** True when quiz start requires an access code, but never exposes the code value itself. */
    private Boolean requiresAccessCode;

    private BigDecimal studentBestScore;

    private BigDecimal studentBestPercentage;

    /** true if student has any passing attempt; null if no attempts yet */
    private Boolean isPassed;

    /** Group UUIDs this quiz is assigned to (empty = open to all). Used by
     *  the student dashboard's group-filter shortcut. */
    private java.util.List<String> assignedGroupUuids;
}
