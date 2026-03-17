package com.quizmaster.repository;

import com.quizmaster.dto.projection.StudentPerformanceProjection;
import com.quizmaster.entity.QuizAttempt;
import com.quizmaster.enums.AttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    Optional<QuizAttempt> findByUuid(UUID uuid);

    Optional<QuizAttempt> findByUuidAndStudentId(UUID uuid, Long studentId);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.student.id = :studentId AND a.status <> 'INVALIDATED'")
    int countValidAttempts(Long quizId, Long studentId);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.student.id = :studentId AND a.status IN :statuses")
    int countByQuizIdAndStudentIdAndStatusIn(Long quizId, Long studentId, List<AttemptStatus> statuses);

    @Query("SELECT a FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.student.id = :studentId AND a.status = 'IN_PROGRESS'")
    Optional<QuizAttempt> findActiveAttempt(Long quizId, Long studentId);

    @Query("SELECT a FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.student.id = :studentId AND a.status IN :statuses ORDER BY a.submittedAt DESC")
    List<QuizAttempt> findTopByQuizIdAndStudentIdAndStatusInOrderBySubmittedAtDesc(
            Long quizId, Long studentId, List<AttemptStatus> statuses);

    @Query("SELECT a FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.student.id = :studentId ORDER BY a.submittedAt DESC")
    List<QuizAttempt> findAllByQuizAndStudent(Long quizId, Long studentId);

    Page<QuizAttempt> findByStudentIdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

    @Query("SELECT MAX(a.submittedAt) FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.student.id = :studentId AND a.status = 'SUBMITTED'")
    Optional<Instant> findLastSubmittedAt(Long quizId, Long studentId);

    @Query("SELECT a FROM QuizAttempt a WHERE a.status = 'IN_PROGRESS' AND a.deadlineAt <= :now")
    List<QuizAttempt> findExpiredAttempts(Instant now);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.status = :status")
    int countByQuizIdAndStatus(Long quizId, AttemptStatus status);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.status IN ('SUBMITTED','AUTO_SUBMITTED') AND a.marksObtained > :marks")
    int countBetterAttempts(Long quizId, java.math.BigDecimal marks);

    // ─── Student Dashboard queries ───────────────────────

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.student.id = :studentId AND a.quiz.id = :quizId AND a.status IN :statuses")
    int countByStudentIdAndQuizIdAndStatusIn(
            @Param("studentId") Long studentId,
            @Param("quizId") Long quizId,
            @Param("statuses") List<AttemptStatus> statuses);

    @Query("""
            SELECT a FROM QuizAttempt a
            WHERE a.student.id = :studentId
            AND a.quiz.id = :quizId
            AND a.status IN :statuses
            ORDER BY a.marksObtained DESC
            """)
    List<QuizAttempt> findByStudentIdAndQuizIdAndStatusInOrderByMarksObtainedDesc(
            @Param("studentId") Long studentId,
            @Param("quizId") Long quizId,
            @Param("statuses") List<AttemptStatus> statuses,
            Pageable pageable);

    default Optional<QuizAttempt> findTopByStudentIdAndQuizIdAndStatusInOrderByMarksObtainedDesc(
            Long studentId, Long quizId, List<AttemptStatus> statuses) {
        List<QuizAttempt> results = findByStudentIdAndQuizIdAndStatusInOrderByMarksObtainedDesc(
                studentId, quizId, statuses,
                org.springframework.data.domain.PageRequest.of(0, 1));
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Query("SELECT a FROM QuizAttempt a WHERE a.student.id = :studentId AND a.status IN :statuses ORDER BY a.submittedAt DESC")
    Page<QuizAttempt> findByStudentIdAndStatusInOrderBySubmittedAtDesc(
            @Param("studentId") Long studentId,
            @Param("statuses") List<AttemptStatus> statuses,
            Pageable pageable);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.student.id = :studentId AND a.status IN :statuses")
    int countByStudentIdAndStatusIn(
            @Param("studentId") Long studentId,
            @Param("statuses") List<AttemptStatus> statuses);

    @Query("SELECT a FROM QuizAttempt a WHERE a.student.id = :studentId AND a.quiz.id = :quizId AND a.status IN :statuses")
    List<QuizAttempt> findByStudentIdAndQuizIdAndStatusIn(
            @Param("studentId") Long studentId,
            @Param("quizId") Long quizId,
            @Param("statuses") List<AttemptStatus> statuses);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.student.id = :studentId AND a.isPassed = :isPassed AND a.status IN :statuses")
    int countByStudentIdAndIsPassedAndStatusIn(
            @Param("studentId") Long studentId,
            @Param("isPassed") Boolean isPassed,
            @Param("statuses") List<AttemptStatus> statuses);

    @Query("SELECT AVG(a.marksObtained) FROM QuizAttempt a WHERE a.student.id = :studentId AND a.status IN :statuses")
    Optional<BigDecimal> findAverageScoreByStudentId(
            @Param("studentId") Long studentId,
            @Param("statuses") List<AttemptStatus> statuses);

    @Query("SELECT MAX(a.marksObtained) FROM QuizAttempt a WHERE a.student.id = :studentId AND a.status IN :statuses")
    Optional<BigDecimal> findBestScoreByStudentId(
            @Param("studentId") Long studentId,
            @Param("statuses") List<AttemptStatus> statuses);

    // ─── Admin Dashboard queries ──────────────────────────

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.status IN :statuses")
    int countByStatusIn(@Param("statuses") List<AttemptStatus> statuses);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.status IN :statuses AND a.submittedAt >= :startOfDay")
    int countByStatusInAndSubmittedAtAfter(
            @Param("statuses") List<AttemptStatus> statuses,
            @Param("startOfDay") Instant startOfDay);

    @Query("SELECT COUNT(a) FROM QuizAttempt a WHERE a.status IN :statuses AND a.isPassed = true")
    int countPassedByStatusIn(@Param("statuses") List<AttemptStatus> statuses);

    @Query("SELECT a FROM QuizAttempt a WHERE a.status IN :statuses ORDER BY a.submittedAt DESC")
    Page<QuizAttempt> findByStatusInOrderBySubmittedAtDesc(
            @Param("statuses") List<AttemptStatus> statuses,
            Pageable pageable);

    @Query("SELECT a FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.status IN :statuses")
    Page<QuizAttempt> findByQuizIdAndStatusIn(
            @Param("quizId") Long quizId,
            @Param("statuses") List<AttemptStatus> statuses,
            Pageable pageable);

    @Query("""
            SELECT a.quiz.id        AS quizId,
                   COUNT(a)         AS attemptCount,
                   AVG(a.marksObtained) AS avgScore,
                   SUM(CASE WHEN a.isPassed = true THEN 1 ELSE 0 END) AS passCount
            FROM QuizAttempt a
            WHERE a.status IN :statuses
            GROUP BY a.quiz.id
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> findTopQuizzesByAttemptCount(
            @Param("statuses") List<AttemptStatus> statuses,
            Pageable pageable);

    @Query("""
            SELECT
              CAST(u.uuid AS string)                                 AS studentUuid,
              u.fullName                                             AS fullName,
              u.email                                                AS email,
              COUNT(a)                                               AS totalAttempts,
              SUM(CASE WHEN a.isPassed = true  THEN 1 ELSE 0 END)   AS passCount,
              SUM(CASE WHEN a.isPassed = false THEN 1 ELSE 0 END)   AS failCount,
              AVG(a.marksObtained)                                   AS averageScore,
              MAX(a.marksObtained)                                   AS bestScore,
              MAX(a.submittedAt)                                     AS lastAttemptAt
            FROM QuizAttempt a
            JOIN a.student u
            WHERE a.status IN :statuses
            AND u.role = com.quizmaster.enums.UserRole.STUDENT
            AND u.deletedAt IS NULL
            GROUP BY u.uuid, u.fullName, u.email
            ORDER BY COUNT(a) DESC
            """)
    Page<StudentPerformanceProjection> findStudentPerformanceStats(
            @Param("statuses") List<AttemptStatus> statuses,
            Pageable pageable);
}

