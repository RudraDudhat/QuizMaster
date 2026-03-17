package com.quizmaster.repository;

import com.quizmaster.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    Optional<QuizQuestion> findByUuid(UUID uuid);

    @Query("SELECT qq FROM QuizQuestion qq JOIN FETCH qq.question q LEFT JOIN FETCH q.options WHERE qq.quiz.id = :quizId ORDER BY qq.displayOrder")
    List<QuizQuestion> findByQuizIdWithQuestionsAndOptions(Long quizId);

    List<QuizQuestion> findByQuizIdOrderByDisplayOrder(Long quizId);

    Optional<QuizQuestion> findByQuizIdAndQuestionId(Long quizId, Long questionId);

    void deleteByQuizIdAndQuestionId(Long quizId, Long questionId);

    long countByQuizId(Long quizId);

    @Query("SELECT COALESCE(SUM(qq.marks), 0) FROM QuizQuestion qq WHERE qq.quiz.id = :quizId")
    BigDecimal sumMarksByQuizId(Long quizId);
}
