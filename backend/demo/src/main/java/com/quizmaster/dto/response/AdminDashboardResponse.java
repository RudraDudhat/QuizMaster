package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private int totalStudents;
    private int totalQuizzes;
    private int totalAttempts;
    private int activeQuizzes;
    private int attemptsToday;
    private BigDecimal platformPassRate;
    /** Last 10 completed attempts across all students */
    private List<AttemptHistoryResponse> recentAttempts;
    /** Top 5 quizzes by attempt count */
    private List<QuizSummaryDto> topQuizzes;
}
