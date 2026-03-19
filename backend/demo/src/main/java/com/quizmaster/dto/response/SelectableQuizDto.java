package com.quizmaster.dto.response;

import com.quizmaster.enums.QuizStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SelectableQuizDto {
    private UUID quizUuid;
    private String title;
    private QuizStatus status;
}
