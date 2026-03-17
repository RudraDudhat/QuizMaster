package com.quizmaster.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Read-only entity mapped to the vw_attempt_summary database view.
 */
@Entity
@Table(name = "vw_attempt_summary")
@Immutable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttemptSummaryView {

    @Id
    @Column(name = "attempt_id")
    private Long attemptId;

    @Column(name = "attempt_uuid")
    private UUID attemptUuid;

    @Column(name = "quiz_id")
    private Long quizId;

    @Column(name = "quiz_title")
    private String quizTitle;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_email")
    private String studentEmail;

    @Column(name = "attempt_number")
    private Integer attemptNumber;

    @Column(name = "status")
    private String status;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "marks_obtained", precision = 8, scale = 2)
    private BigDecimal marksObtained;

    @Column(name = "total_marks_possible", precision = 8, scale = 2)
    private BigDecimal totalMarksPossible;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "is_passed")
    private Boolean isPassed;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "tab_switch_count")
    private Integer tabSwitchCount;

    @Column(name = "is_flagged_suspicious")
    private Boolean isFlaggedSuspicious;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;
}
