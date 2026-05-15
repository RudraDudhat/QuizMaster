package com.quizmaster.repository;

import com.quizmaster.entity.Quiz;
import com.quizmaster.enums.QuizStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    Optional<Quiz> findByIdAndDeletedAtIsNull(Long id);

    Optional<Quiz> findByUuidAndDeletedAtIsNull(UUID uuid);

    Page<Quiz> findByDeletedAtIsNull(Pageable pageable);

    Page<Quiz> findByStatusAndDeletedAtIsNull(QuizStatus status, Pageable pageable);

    /** Active quizzes whose expiresAt falls inside a window — used by the
     *  QUIZ_EXPIRING reminder scheduler. */
    @Query("""
            SELECT q FROM Quiz q
            WHERE q.status = :status
              AND q.deletedAt IS NULL
              AND q.expiresAt IS NOT NULL
              AND q.expiresAt BETWEEN :from AND :to
            """)
    java.util.List<Quiz> findByStatusAndDeletedAtIsNullAndExpiresAtBetween(
            @Param("status") QuizStatus status,
            @Param("from") java.time.Instant from,
            @Param("to") java.time.Instant to);

    Page<Quiz> findByCreatedByIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.tags LEFT JOIN FETCH q.category WHERE q.id = :id AND q.deletedAt IS NULL")
    Optional<Quiz> findByIdWithTagsAndCategory(Long id);

    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.tags LEFT JOIN FETCH q.category WHERE q.uuid = :uuid AND q.deletedAt IS NULL")
    Optional<Quiz> findByUuidWithTagsAndCategory(UUID uuid);

    @Query("SELECT q FROM Quiz q WHERE q.category.id = :categoryId AND q.deletedAt IS NULL")
    Page<Quiz> findByCategoryIdAndDeletedAtIsNull(Long categoryId, Pageable pageable);

    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.category.id = :categoryId AND q.deletedAt IS NULL")
    long countByCategoryIdAndDeletedAtIsNull(@Param("categoryId") Long categoryId);

    // ─── Student Dashboard queries ───────────────────────

    @Query("""
            SELECT q FROM Quiz q
            WHERE q.status = 'PUBLISHED'
            AND q.deletedAt IS NULL
            AND (q.startsAt IS NULL OR q.startsAt <= :now)
            AND (q.expiresAt IS NULL OR q.expiresAt >= :now)
            """)
    Page<Quiz> findAvailableQuizzes(@Param("now") Instant now, Pageable pageable);

    @Query("""
            SELECT q FROM Quiz q
            WHERE q.status = 'PUBLISHED'
            AND q.deletedAt IS NULL
            AND (q.startsAt IS NULL OR q.startsAt <= :now)
            AND (q.expiresAt IS NULL OR q.expiresAt >= :now)
            ORDER BY q.expiresAt ASC
            """)
    List<Quiz> findUpcomingQuizzes(@Param("now") Instant now, Pageable pageable);

    int countByDeletedAtIsNull();

    int countByStatusAndDeletedAtIsNull(QuizStatus status);

    List<Quiz> findByStatusInAndDeletedAtIsNull(List<QuizStatus> statuses);
}
