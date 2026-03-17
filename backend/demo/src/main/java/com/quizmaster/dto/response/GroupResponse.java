package com.quizmaster.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GroupResponse {

    /** UUID exposed to frontend — NOT Long id */
    private String uuid;
    private String name;
    private String description;
    private Integer memberCount;
    private Instant createdAt;
}
