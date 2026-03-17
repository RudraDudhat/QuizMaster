package com.quizmaster.repository;

import com.quizmaster.entity.StudentGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentGroupRepository extends JpaRepository<StudentGroup, Long> {

    // Primary UUID-based lookup (soft-delete aware — @SQLRestriction also applies)
    Optional<StudentGroup> findByUuidAndDeletedAtIsNull(String uuid);

    // Paginated listing of non-deleted groups
    Page<StudentGroup> findByDeletedAtIsNull(Pageable pageable);

    // Full list of non-deleted groups
    List<StudentGroup> findByDeletedAtIsNull();
}
