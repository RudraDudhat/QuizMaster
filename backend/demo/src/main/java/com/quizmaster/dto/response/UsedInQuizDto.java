package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsedInQuizDto {
    private UUID quizUuid;
    private String quizTitle;
}
