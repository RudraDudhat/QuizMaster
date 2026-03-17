package com.quizmaster.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderQuestionsRequest {

    @NotEmpty(message = "Ordered quiz-question UUIDs list cannot be empty")
    private List<UUID> orderedQuizQuestionUuids;
}
