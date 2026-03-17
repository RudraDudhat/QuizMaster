package com.quizmaster.mapper;

import com.quizmaster.dto.response.GroupMemberResponse;
import com.quizmaster.dto.response.GroupResponse;
import com.quizmaster.entity.StudentGroup;
import com.quizmaster.entity.StudentGroupMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StudentGroupMapper {

    /**
     * Maps a StudentGroup + its member count to GroupResponse.
     * Exposes group uuid (String), NOT group id.
     */
    @Mapping(source = "group.uuid", target = "uuid")
    @Mapping(source = "group.name", target = "name")
    @Mapping(source = "group.description", target = "description")
    @Mapping(source = "group.createdAt", target = "createdAt")
    @Mapping(source = "memberCount", target = "memberCount")
    GroupResponse toResponse(StudentGroup group, int memberCount);

    /**
     * Maps a StudentGroupMember to GroupMemberResponse.
     * Exposes user uuid (String), NOT user id.
     * User.uuid is of type java.util.UUID, converted to String via toString().
     */
    @Mapping(target = "userUuid", expression = "java(member.getUser().getUuid().toString())")
    @Mapping(source = "member.user.fullName", target = "fullName")
    @Mapping(source = "member.user.email", target = "email")
    @Mapping(source = "member.joinedAt", target = "joinedAt")
    GroupMemberResponse toMemberResponse(StudentGroupMember member);
}
