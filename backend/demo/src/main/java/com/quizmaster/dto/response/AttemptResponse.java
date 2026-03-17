package com.quizmaster.dto.response;

import com.quizmaster.enums.AttemptStatus;
import com.quizmaster.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptResponse {

    private UUID uuid;
    private UUID quizUuid;
    private String quizTitle;
    private Integer attemptNumber;
    private AttemptStatus status;

    // Timing
    private Instant startedAt;
    private Instant deadlineAt;
    private Instant submittedAt;
    private Long remainingSeconds;

    // Scoring — populated after submission
    private BigDecimal totalMarksPossible;
    private BigDecimal marksObtained;
    private BigDecimal positiveMarks;
    private BigDecimal negativeMarksDeducted;
    private BigDecimal percentage;
    private Boolean isPassed;

    // Questions served (for the student to navigate)
    private List<AttemptQuestionInfo> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttemptQuestionInfo {
        private UUID quizQuestionUuid;
        private UUID questionUuid;
        private String questionText;
        private QuestionType questionType;
        private BigDecimal marks;
        private BigDecimal negativeMarks;
        private Integer displayOrder;
        private Boolean isAnswered;
        private Boolean isFlagged;
        private List<QuestionResponse.OptionResponse> options;
        private String hintText;
        private String mediaUrl;
        private String mediaType;
        private String codeLanguage;
    }
}
