package com.quizmaster.repository;

import com.quizmaster.entity.User;
import com.quizmaster.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

    Page<User> findByRoleAndDeletedAtIsNull(UserRole role, Pageable pageable);

    List<User> findByRoleAndDeletedAtIsNull(UserRole role);

}
