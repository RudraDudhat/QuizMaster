package com.quizmaster.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetAttemptsRequest {

    /** UUID of the quiz whose attempts should be reset — NOT Long quizId */
    @NotBlank
    private String quizUuid;
}
