package com.quizmaster.repository;

import com.quizmaster.entity.StudentGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface StudentGroupMemberRepository
        extends JpaRepository<StudentGroupMember, StudentGroupMember.StudentGroupMemberId> {

    List<StudentGroupMember> findByGroupId(Long groupId);

    List<StudentGroupMember> findByUserId(Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM StudentGroupMember m WHERE m.group.id = :groupId AND m.user.id = :userId")
    void deleteByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    int countByGroupId(Long groupId);
}
