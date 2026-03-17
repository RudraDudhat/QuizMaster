package com.quizmaster.dto.request;

import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuestionRequest {

    @Size(min = 1, max = 10000, message = "Question text must be 1–10000 characters")
    private String questionText;

    private QuestionType questionType;
    private DifficultyLevel difficulty;

    @DecimalMin(value = "0.0", message = "Default marks cannot be negative")
    @DecimalMax(value = "999.99", message = "Default marks exceeds maximum")
    private BigDecimal defaultMarks;

    @DecimalMin(value = "0.0", message = "Negative marks cannot be negative")
    @DecimalMax(value = "999.99", message = "Negative marks exceeds maximum")
    private BigDecimal negativeMarks;

    @Size(max = 5000, message = "Explanation must not exceed 5000 characters")
    private String explanation;

    @Size(max = 2000, message = "Hint text must not exceed 2000 characters")
    private String hintText;

    @DecimalMin(value = "0.0", message = "Hint mark deduction cannot be negative")
    private BigDecimal hintMarkDeduction;

    @Size(max = 500, message = "Media URL must not exceed 500 characters")
    private String mediaUrl;

    @Size(max = 50, message = "Media type must not exceed 50 characters")
    private String mediaType;

    @Size(max = 30, message = "Code language must not exceed 30 characters")
    private String codeLanguage;

    private Boolean isMandatory;
    private Boolean isArchived;

    @Valid
    @Size(max = 20, message = "Cannot have more than 20 options")
    private List<OptionRequest> options;

    private Set<UUID> tagUuids;

    @Size(max = 5000, message = "Correct answer must not exceed 5000 characters")
    private String correctAnswer;
}
