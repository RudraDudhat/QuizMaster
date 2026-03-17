package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private UUID uuid;
    private String name;
    private String slug;
    private String description;
    private UUID parentUuid;
    private String parentName;
    private String iconUrl;
    private String colorHex;
    private Integer displayOrder;
    private UUID createdByUuid;
    private Instant createdAt;
    private Instant updatedAt;
}
