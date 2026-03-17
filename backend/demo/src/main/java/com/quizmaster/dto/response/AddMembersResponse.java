package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddMembersResponse {

    private int addedCount;
    /** Already-member users — skipped silently */
    private int skippedCount;
    /** UUIDs that could not be resolved to any user */
    private List<String> notFoundUuids;
    /** UUIDs found but whose role is not STUDENT */
    private List<String> invalidRoleUuids;
    private String groupUuid;
    /** Updated total member count after the add operation */
    private int memberCount;
}
