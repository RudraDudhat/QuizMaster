package com.quizmaster.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class AddQuestionToQuizRequest {

    @NotNull(message = "Question UUID is required")
    private UUID questionUuid;

    @NotNull(message = "Marks are required")
    @DecimalMin(value = "0.01", message = "Marks must be positive")
    private BigDecimal marks;

    @Builder.Default
    private BigDecimal negativeMarks = BigDecimal.ZERO;

    @Builder.Default
    private Integer displayOrder = 0;

    private Integer perQuestionSecs;

    @Builder.Default
    private Boolean isInPool = true;
}
