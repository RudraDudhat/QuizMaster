package com.quizmaster.repository;

import com.quizmaster.entity.User;
import com.quizmaster.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByUuid(UUID uuid);

    Optional<User> findByUuidAndDeletedAtIsNull(UUID uuid);

    List<User> findByUuidIn(List<UUID> uuids);

    int countByRoleAndIsActiveTrueAndDeletedAtIsNull(UserRole role);

    @Query("""
            SELECT u FROM User u
            WHERE u.role = 'STUDENT'
            AND u.deletedAt IS NULL
            AND (:keyword IS NULL
                 OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<User> findStudentsByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
