package com.quizmaster.dto.response;

import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {

    private UUID uuid;
    private String questionText;
    private QuestionType questionType;
    private DifficultyLevel difficulty;
    private BigDecimal defaultMarks;
    private BigDecimal negativeMarks;
    private String explanation;
    private String hintText;
    private BigDecimal hintMarkDeduction;
    private String mediaUrl;
    private String mediaType;
    private String codeLanguage;
    private Boolean isMandatory;
    private Boolean isArchived;

    private UUID createdByUuid;
    private String createdByName;

    private List<OptionResponse> options;
    private Set<String> tags;

    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponse {
        private UUID uuid;
        private String optionText;
        private Integer optionOrder;
        private Boolean isCorrect;
        private String mediaUrl;
        private String matchPairKey;
        private String matchPairVal;
    }
}
