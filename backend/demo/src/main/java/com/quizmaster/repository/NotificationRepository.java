package com.quizmaster.repository;

import com.quizmaster.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    Long countByUserIdAndIsReadFalse(Long userId);

    Optional<Notification> findByUuidAndUserId(String uuid, Long userId);

    /** Dedupe helper: have we already sent this type for this reference to this user? */
    boolean existsByUserIdAndTypeAndReferenceUuid(
            Long userId,
            com.quizmaster.enums.NotificationType type,
            String referenceUuid);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now " +
           "WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId, @Param("now") Instant now);
}
