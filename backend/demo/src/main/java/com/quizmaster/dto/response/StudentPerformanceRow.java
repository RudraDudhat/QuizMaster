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
public class StudentPerformanceRow {

    /** User UUID — NOT Long studentId */
    private String studentUuid;
    private String fullName;
    private String email;
    private int totalAttempts;
    private int passCount;
    private int failCount;
    private BigDecimal averageScore;
    private BigDecimal bestScore;
    private BigDecimal passRate;
    private Instant lastAttemptAt;
}
