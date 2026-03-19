package com.quizmaster.repository;

import com.quizmaster.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
