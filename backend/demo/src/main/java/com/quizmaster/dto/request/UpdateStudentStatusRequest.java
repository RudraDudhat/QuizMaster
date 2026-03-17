package com.quizmaster.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStudentStatusRequest {

    @NotNull
    private Boolean isActive;

    /** Optional reason for suspension or reinstatement */
    private String reason;
}
