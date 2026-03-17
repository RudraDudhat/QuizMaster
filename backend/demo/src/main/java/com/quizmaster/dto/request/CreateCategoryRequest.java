package com.quizmaster.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Category slug is required")
    @Size(max = 120, message = "Slug must not exceed 120 characters")
    private String slug;

    private String description;

    private UUID parentUuid;

    private String iconUrl;

    @Size(max = 7, message = "Color hex must be at most 7 characters")
    private String colorHex;

    private Integer displayOrder;
}
