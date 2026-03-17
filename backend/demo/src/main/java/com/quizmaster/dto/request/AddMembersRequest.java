package com.quizmaster.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AddMembersRequest {

    @NotEmpty
    private List<String> userUuids;
}
