package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAccuracyResponse {

    private UUID questionUuid;
    private String questionText; // enriched from Question entity
    private String questionType;

    private Long totalAnswers;
    private Long correctCount;
    private Long skippedCount;
    private Long hintUsedCount;
    private BigDecimal accuracyPct;
    private BigDecimal avgTimeSeconds;
}
