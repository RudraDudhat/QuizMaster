package com.quizmaster.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Read-only entity mapped to the vw_question_accuracy database view.
 * Composite key: (quiz_id, question_id).
 */
@Entity
@Table(name = "vw_question_accuracy")
@Immutable
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(QuestionAccuracyView.QuestionAccuracyId.class)
public class QuestionAccuracyView {

    @Id
    @Column(name = "quiz_id")
    private Long quizId;

    @Id
    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "total_answers")
    private Long totalAnswers;

    @Column(name = "correct_count")
    private Long correctCount;

    @Column(name = "skipped_count")
    private Long skippedCount;

    @Column(name = "hint_used_count")
    private Long hintUsedCount;

    @Column(name = "accuracy_pct", precision = 5, scale = 2)
    private BigDecimal accuracyPct;

    @Column(name = "avg_time_seconds")
    private BigDecimal avgTimeSeconds;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionAccuracyId implements Serializable {
        private Long quizId;
        private Long questionId;
    }
}
