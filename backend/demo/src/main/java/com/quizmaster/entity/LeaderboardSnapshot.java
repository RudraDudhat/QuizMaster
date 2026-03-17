package com.quizmaster.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "leaderboard_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String scope;

    @Column(name = "scope_id")
    private Long scopeId;

    @Column(nullable = false, length = 20)
    private String period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "rank", nullable = false)
    private Integer rank;

    @Column(name = "total_xp", nullable = false)
    private Integer totalXp;

    @Column(name = "quizzes_taken", nullable = false)
    private Integer quizzesTaken;

    @Column(name = "avg_score", precision = 5, scale = 2)
    private BigDecimal avgScore;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (totalXp == null)
            totalXp = 0;
        if (quizzesTaken == null)
            quizzesTaken = 0;
        if (snapshotDate == null)
            snapshotDate = LocalDate.now();
    }
}
