package com.quizmaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Compact group summary for the student dashboard:
 *   - groupUuid: stable identifier for the group
 *   - name: shown as the chip label
 *   - memberCount: e.g. "Math 101 · 24 members"
 *   - quizCount: how many quizzes are currently assigned to this group
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyGroupSummary {
    private String groupUuid;
    private String name;
    private Integer memberCount;
    private Integer quizCount;
}
