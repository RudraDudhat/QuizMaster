package com.quizmaster.repository;

import com.quizmaster.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}
