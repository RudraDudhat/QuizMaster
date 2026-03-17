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
public class QuizAttemptListResponse {

    /** Attempt UUID — NOT Long attemptId */
    private String attemptUuid;
    /** User UUID — NOT Long studentId */
    private String studentUuid;
    private String studentName;
    private String studentEmail;
    private int attemptNumber;
    private String status;
    private BigDecimal marksObtained;
    private BigDecimal totalMarksPossible;
    private BigDecimal percentage;
    private Boolean isPassed;
    private Long timeTakenSeconds;
    private Instant submittedAt;
    private Boolean isFlaggedSuspicious;
    private int tabSwitchCount;
}
