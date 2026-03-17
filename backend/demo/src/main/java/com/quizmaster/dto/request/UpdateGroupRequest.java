package com.quizmaster.dto.request;

import lombok.Data;

@Data
public class UpdateGroupRequest {

    /** null means no change */
    private String name;

    /** null means no change */
    private String description;
}
