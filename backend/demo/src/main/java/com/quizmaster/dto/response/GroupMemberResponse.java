package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {

    /** User's UUID — NOT Long userId */
    private String userUuid;
    private String fullName;
    private String email;
    private Instant joinedAt;
}
