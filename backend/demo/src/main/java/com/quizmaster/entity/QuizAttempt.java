package com.quizmaster.entity;

import com.quizmaster.enums.AttemptStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quiz_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    // Use a SQL default so adding this column to a populated table backfills
    // existing rows to 0 instead of failing with a NOT NULL violation.
    @Column(nullable = false, columnDefinition = "BIGINT NOT NULL DEFAULT 0")
    private Long version;

    @Column(nullable = false, updatable = false)
    private UUID uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptStatus status;

    // --- Timing ---

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "deadline_at", nullable = false)
    private Instant deadlineAt;

    // --- Scoring ---

    @Column(name = "total_marks_possible", nullable = false, precision = 8, scale = 2)
    private BigDecimal totalMarksPossible;

    @Column(name = "marks_obtained", nullable = false, precision = 8, scale = 2)
    private BigDecimal marksObtained;

    @Column(name = "positive_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal positiveMarks;

    @Column(name = "negative_marks_deducted", nullable = false, precision = 8, scale = 2)
    private BigDecimal negativeMarksDeducted;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "is_passed")
    private Boolean isPassed;

    @Column(name = "rank")
    private Integer rank;

    // --- Anti-cheat ---

    @Column(name = "tab_switch_count", nullable = false)
    private Integer tabSwitchCount;

    @Column(name = "fullscreen_exit_count", nullable = false)
    private Integer fullscreenExitCount;

    @Column(name = "is_flagged_suspicious", nullable = false)
    private Boolean isFlaggedSuspicious;

    @Column(name = "invalidation_reason", columnDefinition = "TEXT")
    private String invalidationReason;

    @Column(name = "question_order", columnDefinition = "TEXT")
    private String questionOrder;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    // --- Timestamps ---

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (uuid == null)
            uuid = UUID.randomUUID();
        if (attemptNumber == null)
            attemptNumber = 1;
        if (status == null)
            status = AttemptStatus.IN_PROGRESS;
        if (startedAt == null)
            startedAt = Instant.now();
        if (totalMarksPossible == null)
            totalMarksPossible = BigDecimal.ZERO;
        if (marksObtained == null)
            marksObtained = BigDecimal.ZERO;
        if (positiveMarks == null)
            positiveMarks = BigDecimal.ZERO;
        if (negativeMarksDeducted == null)
            negativeMarksDeducted = BigDecimal.ZERO;
        if (tabSwitchCount == null)
            tabSwitchCount = 0;
        if (fullscreenExitCount == null)
            fullscreenExitCount = 0;
        if (isFlaggedSuspicious == null)
            isFlaggedSuspicious = false;
        if (questionOrder == null)
            questionOrder = "";
        if (version == null)
            version = 0L;
    }
}
