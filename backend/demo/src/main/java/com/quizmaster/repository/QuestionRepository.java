package com.quizmaster.repository;

import com.quizmaster.entity.Question;
import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long>, JpaSpecificationExecutor<Question> {

    Optional<Question> findByIdAndDeletedAtIsNull(Long id);

    Optional<Question> findByUuidAndDeletedAtIsNull(UUID uuid);

    Page<Question> findByDeletedAtIsNull(Pageable pageable);

    Page<Question> findByQuestionTypeAndDeletedAtIsNull(QuestionType type, Pageable pageable);

    Page<Question> findByDifficultyAndDeletedAtIsNull(DifficultyLevel difficulty, Pageable pageable);

    Page<Question> findByIsArchivedAndDeletedAtIsNull(Boolean isArchived, Pageable pageable);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options LEFT JOIN FETCH q.tags WHERE q.id = :id AND q.deletedAt IS NULL")
    Optional<Question> findByIdWithOptionsAndTags(Long id);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options LEFT JOIN FETCH q.tags WHERE q.uuid = :uuid AND q.deletedAt IS NULL")
    Optional<Question> findByUuidWithOptionsAndTags(UUID uuid);

    @Query("SELECT q FROM Question q JOIN q.tags t WHERE t.id = :tagId AND q.deletedAt IS NULL")
    Page<Question> findByTagIdAndDeletedAtIsNull(Long tagId, Pageable pageable);

    @Query("SELECT q FROM Question q JOIN q.tags t WHERE t.uuid = :tagUuid AND q.deletedAt IS NULL")
    Page<Question> findByTagUuidAndDeletedAtIsNull(@org.springframework.data.repository.query.Param("tagUuid") UUID tagUuid, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE LOWER(q.questionText) LIKE LOWER(CONCAT('%', :keyword, '%')) AND q.deletedAt IS NULL")
    Page<Question> searchByKeyword(String keyword, Pageable pageable);
}
