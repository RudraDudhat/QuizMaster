package com.quizmaster.mapper;

import com.quizmaster.dto.response.AdminStudentDetailResponse;
import com.quizmaster.dto.response.AdminStudentListResponse;
import com.quizmaster.dto.response.AttemptHistoryResponse;
import com.quizmaster.dto.response.GroupResponse;
import com.quizmaster.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public interface AdminStudentMapper {

    /**
     * Maps a User + computed stats to AdminStudentListResponse.
     * Exposes user uuid (String), NOT Long id.
     * User.uuid is java.util.UUID — converted to String via toString().
     */
    @Mapping(target = "uuid", expression = "java(user.getUuid().toString())")
    @Mapping(source = "user.fullName", target = "fullName")
    @Mapping(source = "user.email", target = "email")
    @Mapping(source = "user.isActive", target = "isActive")
    @Mapping(source = "user.xpPoints", target = "xpPoints")
    @Mapping(source = "user.streakDays", target = "streakDays")
    @Mapping(source = "user.createdAt", target = "createdAt")
    @Mapping(source = "user.lastLoginAt", target = "lastLoginAt")
    @Mapping(source = "totalAttempts", target = "totalAttempts")
    @Mapping(source = "averageScore", target = "averageScore")
    @Mapping(source = "passRate", target = "passRate")
    AdminStudentListResponse toListResponse(User user, int totalAttempts,
            BigDecimal averageScore, BigDecimal passRate);

    /**
     * Maps a User + computed stats + enriched collections to
     * AdminStudentDetailResponse.
     */
    @Mapping(target = "uuid", expression = "java(user.getUuid().toString())")
    @Mapping(source = "user.fullName", target = "fullName")
    @Mapping(source = "user.email", target = "email")
    @Mapping(source = "user.isActive", target = "isActive")
    @Mapping(source = "user.xpPoints", target = "xpPoints")
    @Mapping(source = "user.streakDays", target = "streakDays")
    @Mapping(source = "user.createdAt", target = "createdAt")
    @Mapping(source = "user.lastLoginAt", target = "lastLoginAt")
    @Mapping(source = "user.profilePictureUrl", target = "profilePictureUrl")
    @Mapping(source = "user.bio", target = "bio")
    @Mapping(source = "totalAttempts", target = "totalAttempts")
    @Mapping(source = "averageScore", target = "averageScore")
    @Mapping(source = "passRate", target = "passRate")
    @Mapping(source = "recentAttempts", target = "recentAttempts")
    @Mapping(source = "groupMemberships", target = "groupMemberships")
    AdminStudentDetailResponse toDetailResponse(User user, int totalAttempts,
            BigDecimal averageScore, BigDecimal passRate,
            List<AttemptHistoryResponse> recentAttempts,
            List<GroupResponse> groupMemberships);
}
