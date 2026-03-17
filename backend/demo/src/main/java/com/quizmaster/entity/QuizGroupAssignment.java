package com.quizmaster.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "quiz_group_assignments")
@IdClass(QuizGroupAssignment.QuizGroupAssignmentId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizGroupAssignment {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private StudentGroup group;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @PrePersist
    public void prePersist() {
        if (assignedAt == null)
            assignedAt = Instant.now();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizGroupAssignmentId implements Serializable {
        private Long quiz;
        private Long group;
    }
}
