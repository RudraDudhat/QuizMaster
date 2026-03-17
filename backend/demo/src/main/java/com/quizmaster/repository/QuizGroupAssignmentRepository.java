package com.quizmaster.repository;

import com.quizmaster.entity.QuizGroupAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizGroupAssignmentRepository
        extends JpaRepository<QuizGroupAssignment, QuizGroupAssignment.QuizGroupAssignmentId> {

    boolean existsByQuizId(Long quizId);

    boolean existsByQuizIdAndGroupId(Long quizId, Long groupId);
}
