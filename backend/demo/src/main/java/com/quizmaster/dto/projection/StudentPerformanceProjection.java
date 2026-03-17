package com.quizmaster.dto.projection;

import java.math.BigDecimal;
import java.time.Instant;

public interface StudentPerformanceProjection {
    String getStudentUuid();
    String getFullName();
    String getEmail();
    int getTotalAttempts();
    int getPassCount();
    int getFailCount();
    BigDecimal getAverageScore();
    BigDecimal getBestScore();
    Instant getLastAttemptAt();
}
