package com.quizmaster.dto.request;

import com.quizmaster.enums.QuizStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private QuizStatus status;
}
