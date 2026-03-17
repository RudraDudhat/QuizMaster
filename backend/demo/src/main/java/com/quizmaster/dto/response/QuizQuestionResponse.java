package com.quizmaster.dto.response;

import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
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
public class QuizQuestionResponse {

    private UUID uuid;
    private UUID quizUuid;
    private UUID questionUuid;
    private String questionText;
    private QuestionType questionType;
    private DifficultyLevel difficulty;
    private BigDecimal marks;
    private BigDecimal negativeMarks;
    private Integer displayOrder;
    private Boolean isInPool;
    private Integer perQuestionSecs;
}
