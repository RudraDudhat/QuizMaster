package com.quizmaster.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionRequest {

    @NotBlank(message = "Option text is required")
    @Size(max = 2000, message = "Option text must not exceed 2000 characters")
    private String optionText;

    private Integer optionOrder;
    private Boolean isCorrect;

    @Size(max = 500, message = "Media URL must not exceed 500 characters")
    private String mediaUrl;

    // For MATCHING type
    @Size(max = 500, message = "Match pair key must not exceed 500 characters")
    private String matchPairKey;

    @Size(max = 500, message = "Match pair value must not exceed 500 characters")
    private String matchPairVal;
}
