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
public class NotificationResponse {

    private String uuid;
    private String type;
    private String title;
    private String message;
    private String actionUrl;
    private Boolean isRead;
    private Instant readAt;
    private Instant createdAt;
    private String referenceUuid;
    private String referenceType;
}
