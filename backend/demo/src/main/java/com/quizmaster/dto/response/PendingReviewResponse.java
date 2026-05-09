package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** One row in the admin's "essays awaiting grading" queue. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingReviewResponse {
    private String attemptUuid;
    private String quizUuid;
    private String quizTitle;
    private String studentUuid;
    private String studentName;
    private String studentEmail;
    private Instant submittedAt;
    private Integer pendingCount;
    private Integer totalQuestions;
}
