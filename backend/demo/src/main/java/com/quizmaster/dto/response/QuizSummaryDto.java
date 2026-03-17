package com.quizmaster.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizSummaryDto {

    /** Quiz UUID exposed to frontend — NOT Long id */
    private String quizUuid;
    private String title;
    private int attemptCount;
    private BigDecimal avgScore;
    private BigDecimal passRate;
    private String status;
}
