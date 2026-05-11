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
public class StudentDashboardResponse {

    private int totalQuizzesTaken;

    private int totalQuizzesPassed;

    /** Average marks obtained across all completed attempts */
    private BigDecimal averageScore;

    /** Highest marks obtained in a single attempt */
    private BigDecimal bestScore;

    /** Pass rate as a percentage, e.g. 72.50 */
    private BigDecimal passRate;

    /** Consecutive active days (from user.streakDays) */
    private int currentStreak;

    /** Experience points accumulated by the student */
    private int xpPoints;

    /** Last 5 completed attempts, newest first */
    private List<AttemptHistoryResponse> recentAttempts;

    /** Next 3 available quizzes sorted by expiresAt ASC */
    private List<AvailableQuizResponse> upcomingQuizzes;

    /** Groups (classes) this student is a member of. */
    private List<MyGroupSummary> myGroups;
}
