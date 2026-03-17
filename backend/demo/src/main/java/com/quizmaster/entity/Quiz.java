package com.quizmaster.entity;

import com.quizmaster.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "quizzes")
@SQLRestriction("deleted_at IS NULL")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID uuid;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_type", nullable = false)
    private QuizType quizType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DifficultyLevel difficulty;

    // --- Timer configuration ---

    @Enumerated(EnumType.STRING)
    @Column(name = "timer_mode", nullable = false)
    private TimerMode timerMode;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;

    @Column(name = "per_question_seconds")
    private Integer perQuestionSeconds;

    @Column(name = "grace_period_seconds", nullable = false)
    private Integer gracePeriodSeconds;

    // --- Scoring configuration ---

    @Column(name = "total_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal totalMarks;

    @Column(name = "pass_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal passMarks;

    @Column(name = "negative_marking_factor", nullable = false, precision = 4, scale = 2)
    private BigDecimal negativeMarkingFactor;

    // --- Attempt rules ---

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts;

    @Column(name = "cooldown_hours", nullable = false)
    private Integer cooldownHours;

    // --- Access control ---

    @Column(name = "access_code", length = 50)
    private String accessCode;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "allowed_ip_range")
    private String allowedIpRange;

    // --- Question pool ---

    @Column(name = "question_pool_size")
    private Integer questionPoolSize;

    @Column(name = "questions_to_serve")
    private Integer questionsToServe;

    @Column(name = "shuffle_questions", nullable = false)
    private Boolean shuffleQuestions;

    @Column(name = "shuffle_options", nullable = false)
    private Boolean shuffleOptions;

    @Column(name = "allow_back_navigation", nullable = false)
    private Boolean allowBackNavigation;

    @Column(name = "show_result_immediately", nullable = false)
    private Boolean showResultImmediately;

    @Column(name = "show_correct_answers", nullable = false)
    private Boolean showCorrectAnswers;

    @Column(name = "show_leaderboard", nullable = false)
    private Boolean showLeaderboard;

    // --- Display ---

    @Column(name = "color_label", length = 7)
    private String colorLabel;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(nullable = false)
    private Integer version;

    // --- Tags (Many-to-Many) ---

    @ManyToMany
    @JoinTable(name = "quiz_tags", joinColumns = @JoinColumn(name = "quiz_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    // --- Timestamps ---

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    public void prePersist() {
        if (uuid == null)
            uuid = UUID.randomUUID();
        if (status == null)
            status = QuizStatus.DRAFT;
        if (quizType == null)
            quizType = QuizType.EXAM;
        if (difficulty == null)
            difficulty = DifficultyLevel.MEDIUM;
        if (timerMode == null)
            timerMode = TimerMode.GLOBAL;
        if (gracePeriodSeconds == null)
            gracePeriodSeconds = 0;
        if (totalMarks == null)
            totalMarks = BigDecimal.ZERO;
        if (passMarks == null)
            passMarks = BigDecimal.ZERO;
        if (negativeMarkingFactor == null)
            negativeMarkingFactor = BigDecimal.ZERO;
        if (maxAttempts == null)
            maxAttempts = 1;
        if (cooldownHours == null)
            cooldownHours = 0;
        if (shuffleQuestions == null)
            shuffleQuestions = true;
        if (shuffleOptions == null)
            shuffleOptions = true;
        if (allowBackNavigation == null)
            allowBackNavigation = true;
        if (showResultImmediately == null)
            showResultImmediately = true;
        if (showCorrectAnswers == null)
            showCorrectAnswers = true;
        if (showLeaderboard == null)
            showLeaderboard = true;
        if (isPinned == null)
            isPinned = false;
        if (displayOrder == null)
            displayOrder = 0;
        if (version == null)
            version = 1;
    }
}
