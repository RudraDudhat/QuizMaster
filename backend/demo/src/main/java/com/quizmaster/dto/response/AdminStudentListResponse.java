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
public class AdminStudentListResponse {

    /** User UUID exposed to frontend — NOT Long id */
    private String uuid;
    private String fullName;
    private String email;
    private Boolean isActive;
    private Integer xpPoints;
    private Integer streakDays;
    private Instant createdAt;
    private Instant lastLoginAt;
    private int totalAttempts;
    private BigDecimal averageScore;
    private BigDecimal passRate;
}
