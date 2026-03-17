package com.quizmaster.service;

import com.quizmaster.dto.request.AddMembersRequest;
import com.quizmaster.dto.request.CreateGroupRequest;
import com.quizmaster.dto.request.UpdateGroupRequest;
import com.quizmaster.dto.response.AddMembersResponse;
import com.quizmaster.dto.response.GroupMemberResponse;
import com.quizmaster.dto.response.GroupResponse;
import com.quizmaster.entity.StudentGroup;
import com.quizmaster.entity.StudentGroupMember;
import com.quizmaster.entity.User;
import com.quizmaster.enums.UserRole;
import com.quizmaster.exception.ResourceNotFoundException;
import com.quizmaster.mapper.StudentGroupMapper;
import com.quizmaster.repository.StudentGroupMemberRepository;
import com.quizmaster.repository.StudentGroupRepository;
import com.quizmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentGroupService {

    private final StudentGroupRepository studentGroupRepository;
    private final StudentGroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final StudentGroupMapper groupMapper;

    // ─── Create ──────────────────────────────────────────

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        StudentGroup group = StudentGroup.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(admin)
                .build();

        group = studentGroupRepository.save(group);
        return groupMapper.toResponse(group, 0);
    }

    // ─── Read ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<GroupResponse> getAllGroups(Pageable pageable) {
        return studentGroupRepository.findByDeletedAtIsNull(pageable)
                .map(group -> {
                    int count = memberRepository.countByGroupId(group.getId());
                    return groupMapper.toResponse(group, count);
                });
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupByUuid(String groupUuid) {
        StudentGroup group = findGroupOrThrow(groupUuid);
        int count = memberRepository.countByGroupId(group.getId());
        return groupMapper.toResponse(group, count);
    }

    // ─── Update ──────────────────────────────────────────

    @Transactional
    public GroupResponse updateGroup(String groupUuid, UpdateGroupRequest request) {
        StudentGroup group = findGroupOrThrow(groupUuid);

        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        group = studentGroupRepository.save(group);
        int count = memberRepository.countByGroupId(group.getId());
        return groupMapper.toResponse(group, count);
    }

    // ─── Soft Delete ─────────────────────────────────────

    @Transactional
    public void deleteGroup(String groupUuid) {
        StudentGroup group = findGroupOrThrow(groupUuid);
        group.setDeletedAt(Instant.now());
        studentGroupRepository.save(group);
    }

    // ─── Members: Add ────────────────────────────────────

    @Transactional
    public AddMembersResponse addMembers(String groupUuid, AddMembersRequest request) {
        StudentGroup group = findGroupOrThrow(groupUuid);
        Long groupId = group.getId();

        // Separate valid UUID strings from malformed ones
        List<String> requestedUuids = request.getUserUuids();
        Map<String, UUID> parsedUuids = new LinkedHashMap<>();
        List<String> notFoundUuids = new ArrayList<>();

        for (String raw : requestedUuids) {
            try {
                parsedUuids.put(raw, UUID.fromString(raw));
            } catch (IllegalArgumentException e) {
                notFoundUuids.add(raw);  // malformed UUID → treat as not found
            }
        }

        // Bulk lookup by UUID
        List<User> foundUsers = userRepository.findByUuidIn(new ArrayList<>(parsedUuids.values()));
        Map<String, User> foundByUuid = foundUsers.stream()
                .collect(Collectors.toMap(u -> u.getUuid().toString(), u -> u));

        // Users whose UUID was valid but not found in DB
        for (Map.Entry<String, UUID> entry : parsedUuids.entrySet()) {
            if (!foundByUuid.containsKey(entry.getKey())) {
                notFoundUuids.add(entry.getKey());
            }
        }

        // Split found users into valid students vs wrong role
        List<String> invalidRoleUuids = new ArrayList<>();
        List<User> validStudents = new ArrayList<>();

        for (User user : foundUsers) {
            if (user.getRole() == UserRole.STUDENT) {
                validStudents.add(user);
            } else {
                invalidRoleUuids.add(user.getUuid().toString());
            }
        }

        // Add or skip
        int addedCount = 0;
        int skippedCount = 0;

        for (User student : validStudents) {
            if (memberRepository.existsByGroupIdAndUserId(groupId, student.getId())) {
                skippedCount++;
            } else {
                StudentGroupMember member = StudentGroupMember.builder()
                        .group(group)
                        .user(student)
                        .build();
                memberRepository.save(member);
                addedCount++;
            }
        }

        int memberCount = memberRepository.countByGroupId(groupId);

        return AddMembersResponse.builder()
                .addedCount(addedCount)
                .skippedCount(skippedCount)
                .notFoundUuids(notFoundUuids)
                .invalidRoleUuids(invalidRoleUuids)
                .groupUuid(groupUuid)
                .memberCount(memberCount)
                .build();
    }

    // ─── Members: Remove ─────────────────────────────────

    @Transactional
    public void removeMember(String groupUuid, String userUuid) {
        StudentGroup group = findGroupOrThrow(groupUuid);

        UUID parsedUserUuid;
        try {
            parsedUserUuid = UUID.fromString(userUuid);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("User not found");
        }

        User user = userRepository.findByUuid(parsedUserUuid)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!memberRepository.existsByGroupIdAndUserId(group.getId(), user.getId())) {
            throw new ResourceNotFoundException("Member not found in this group");
        }

        memberRepository.deleteByGroupIdAndUserId(group.getId(), user.getId());
    }

    // ─── Members: List ───────────────────────────────────

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getGroupMembers(String groupUuid) {
        StudentGroup group = findGroupOrThrow(groupUuid);

        return memberRepository.findByGroupId(group.getId()).stream()
                .sorted(Comparator.comparing(StudentGroupMember::getJoinedAt).reversed())
                .map(groupMapper::toMemberResponse)
                .collect(Collectors.toList());
    }

    // ─── Student's own groups ────────────────────────────

    @Transactional(readOnly = true)
    public List<GroupResponse> getGroupsForStudent(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return memberRepository.findByUserId(student.getId()).stream()
                .map(StudentGroupMember::getGroup)
                .filter(g -> g.getDeletedAt() == null)
                .map(group -> {
                    int count = memberRepository.countByGroupId(group.getId());
                    return groupMapper.toResponse(group, count);
                })
                .collect(Collectors.toList());
    }

    // ─── Private helper ──────────────────────────────────

    private StudentGroup findGroupOrThrow(String groupUuid) {
        return studentGroupRepository.findByUuidAndDeletedAtIsNull(groupUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }
}
