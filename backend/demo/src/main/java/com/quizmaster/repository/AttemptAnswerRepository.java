package com.quizmaster.repository;

import com.quizmaster.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {

    Optional<AttemptAnswer> findByAttemptIdAndQuizQuestionId(Long attemptId, Long quizQuestionId);

    List<AttemptAnswer> findByAttemptId(Long attemptId);

    long countByQuizQuestionId(Long quizQuestionId);

    @Query("SELECT COUNT(a) FROM AttemptAnswer a WHERE a.attempt.id = :attemptId AND a.isSkipped = false")
    int countAnsweredByAttemptId(Long attemptId);

    /** Essay answers awaiting manual grading inside a single attempt. */
    @Query("""
            SELECT COUNT(a) FROM AttemptAnswer a
            WHERE a.attempt.id = :attemptId
              AND a.question.questionType = com.quizmaster.enums.QuestionType.ESSAY
              AND a.isCorrect IS NULL
              AND a.isSkipped = false
            """)
    int countPendingReviewByAttemptId(@Param("attemptId") Long attemptId);

    /** Total essay answers across the platform that still need grading. */
    @Query("""
            SELECT COUNT(a) FROM AttemptAnswer a
            WHERE a.question.questionType = com.quizmaster.enums.QuestionType.ESSAY
              AND a.isCorrect IS NULL
              AND a.isSkipped = false
              AND a.attempt.status IN ('SUBMITTED', 'AUTO_SUBMITTED')
            """)
    long countAllPendingReviews();

    /**
     * Returns per-question accuracy stats for all attempts of a given quiz.
     * Each row: [questionId(Long), totalAnswers(Long), correctCount(Long), skippedCount(Long), hintUsedCount(Long), avgTimeSeconds(Double)]
     */
    @Query("""
            SELECT a.question.id,
                   COUNT(a),
                   SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0 END),
                   SUM(CASE WHEN a.isSkipped = true THEN 1 ELSE 0 END),
                   SUM(CASE WHEN a.hintUsed = true THEN 1 ELSE 0 END),
                   AVG(CAST(a.timeSpentSeconds AS double))
            FROM AttemptAnswer a
            WHERE a.attempt.quiz.id = :quizId
              AND a.attempt.status IN :statuses
            GROUP BY a.question.id
            """)
    List<Object[]> findQuestionAccuracyByQuizId(
            @Param("quizId") Long quizId,
            @Param("statuses") List<com.quizmaster.enums.AttemptStatus> statuses);
}
