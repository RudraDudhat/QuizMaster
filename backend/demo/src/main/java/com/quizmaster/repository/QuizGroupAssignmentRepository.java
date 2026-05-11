package com.quizmaster.repository;

import com.quizmaster.entity.QuizGroupAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizGroupAssignmentRepository
        extends JpaRepository<QuizGroupAssignment, QuizGroupAssignment.QuizGroupAssignmentId> {

    boolean existsByQuizId(Long quizId);

    boolean existsByQuizIdAndGroupId(Long quizId, Long groupId);

    /** Count distinct quizzes currently assigned to a group. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(DISTINCT a.quiz.id) FROM QuizGroupAssignment a
            WHERE a.group.id = :groupId
              AND a.quiz.deletedAt IS NULL
            """)
    int countQuizzesByGroupId(@org.springframework.data.repository.query.Param("groupId") Long groupId);
}
