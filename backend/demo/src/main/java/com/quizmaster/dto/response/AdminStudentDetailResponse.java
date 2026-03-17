package com.quizmaster.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminStudentDetailResponse {

    /** User UUID exposed to frontend — NOT Long id */
    private String uuid;
    private String fullName;
    private String email;
    private Boolean isActive;
    private Integer xpPoints;
    private Integer streakDays;
    private Instant createdAt;
    private Instant lastLoginAt;
    private String profilePictureUrl;
    private String bio;
    private int totalAttempts;
    private BigDecimal averageScore;
    private BigDecimal passRate;
    /** Last 10 completed attempts */
    private List<AttemptHistoryResponse> recentAttempts;
    /** Groups the student belongs to */
    private List<GroupResponse> groupMemberships;
}
