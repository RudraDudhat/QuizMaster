package com.quizmaster.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Body for an admin grading a single essay answer.
 *
 *   marksAwarded — non-negative; clamped server-side to the question's max.
 *   isCorrect    — TRUE = approved (full credit), FALSE = rejected (no credit).
 *                  The admin can also award partial marks while still flagging
 *                  the answer is_correct = false; we trust whatever they send.
 *   note         — optional comment shown to the student in their review.
 */
@Data
public class GradeEssayRequest {

    @NotNull(message = "marksAwarded is required")
    @DecimalMin(value = "0.0", message = "marksAwarded cannot be negative")
    private BigDecimal marksAwarded;

    @NotNull(message = "isCorrect is required")
    private Boolean isCorrect;

    private String note;
}
