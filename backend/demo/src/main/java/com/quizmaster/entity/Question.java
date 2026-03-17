package com.quizmaster.entity;

import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
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
@Table(name = "questions")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "createdBy", "tags", "options" })
@EqualsAndHashCode(exclude = { "createdBy", "tags", "options" })
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID uuid;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DifficultyLevel difficulty;

    @Column(name = "default_marks", nullable = false, precision = 6, scale = 2)
    private BigDecimal defaultMarks;

    @Column(name = "negative_marks", nullable = false, precision = 6, scale = 2)
    private BigDecimal negativeMarks;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "hint_text", columnDefinition = "TEXT")
    private String hintText;

    @Column(name = "hint_mark_deduction", nullable = false, precision = 4, scale = 2)
    private BigDecimal hintMarkDeduction;

    @Column(name = "media_url", columnDefinition = "TEXT")
    private String mediaUrl;

    @Column(name = "media_type", length = 20)
    private String mediaType;

    @Column(name = "code_language", length = 40)
    private String codeLanguage;

    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private User createdBy;

    // --- Tags (Many-to-Many) ---

    @ManyToMany
    @JoinTable(name = "question_tags", joinColumns = @JoinColumn(name = "question_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    // --- Options (One-to-Many) ---

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<QuestionOption> options = new HashSet<>();

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
        if (difficulty == null)
            difficulty = DifficultyLevel.MEDIUM;
        if (defaultMarks == null)
            defaultMarks = BigDecimal.ONE;
        if (negativeMarks == null)
            negativeMarks = BigDecimal.ZERO;
        if (hintMarkDeduction == null)
            hintMarkDeduction = BigDecimal.ZERO;
        if (isMandatory == null)
            isMandatory = false;
        if (isArchived == null)
            isArchived = false;
    }
}
