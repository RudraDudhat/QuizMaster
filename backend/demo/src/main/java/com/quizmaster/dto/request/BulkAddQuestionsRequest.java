package com.quizmaster.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkAddQuestionsRequest {

    @NotEmpty(message = "questionUuids must not be empty")
    private List<UUID> questionUuids;
}
