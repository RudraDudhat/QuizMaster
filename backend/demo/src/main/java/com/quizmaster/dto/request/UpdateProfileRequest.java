package com.quizmaster.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/** Fields the current user may edit on their own profile. */
@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 150, message = "Full name must be 2–150 characters")
    private String fullName;

    @Size(max = 100, message = "Display name must be at most 100 characters")
    private String displayName;

    @Size(max = 1000, message = "Bio must be at most 1000 characters")
    private String bio;

    @Size(max = 2048, message = "Profile picture URL is too long")
    private String profilePictureUrl;
}
