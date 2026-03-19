package com.quizmaster.repository;

import com.quizmaster.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    Set<Tag> findByIdIn(Set<Long> ids);

    Set<Tag> findByUuidIn(Set<UUID> uuids);

    Optional<Tag> findByUuid(UUID uuid);

    Optional<Tag> findByNameIgnoreCase(String name);

    List<Tag> findByNameContainingIgnoreCase(String keyword);

    boolean existsBySlug(String slug);

    @Query("SELECT COUNT(q) FROM Quiz q JOIN q.tags t WHERE t.id = :tagId AND q.deletedAt IS NULL")
    long countQuizzesByTagId(@Param("tagId") Long tagId);

    @Query("SELECT COUNT(que) FROM Question que JOIN que.tags t WHERE t.id = :tagId AND que.deletedAt IS NULL")
    long countQuestionsByTagId(@Param("tagId") Long tagId);
}
