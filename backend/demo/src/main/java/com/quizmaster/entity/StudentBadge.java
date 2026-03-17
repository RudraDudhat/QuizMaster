package com.quizmaster.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "student_badges", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "student_id", "badge_id" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @Column(name = "earned_at", nullable = false)
    private Instant earnedAt;

    @PrePersist
    public void prePersist() {
        if (earnedAt == null)
            earnedAt = Instant.now();
    }
}
