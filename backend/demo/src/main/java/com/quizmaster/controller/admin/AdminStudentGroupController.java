package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.AddMembersRequest;
import com.quizmaster.dto.request.CreateGroupRequest;
import com.quizmaster.dto.request.UpdateGroupRequest;
import com.quizmaster.dto.response.*;
import com.quizmaster.service.StudentGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/groups")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminStudentGroupController {

    private final StudentGroupService studentGroupService;

    // ─── GET /api/v1/admin/groups ────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GroupResponse>>> getAllGroups(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<GroupResponse> groups = studentGroupService.getAllGroups(pageable);
        return ResponseEntity.ok(ApiResponse.success("Groups retrieved", groups));
    }

    // ─── POST /api/v1/admin/groups ───────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponse>> createGroup(
            @RequestBody @Valid CreateGroupRequest request,
            Authentication authentication) {

        String email = extractEmail(authentication);
        GroupResponse group = studentGroupService.createGroup(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created", group));
    }

    // ─── GET /api/v1/admin/groups/{groupUuid} ────────────

    @GetMapping("/{groupUuid}")
    public ResponseEntity<ApiResponse<GroupResponse>> getGroup(
            @PathVariable String groupUuid) {

        GroupResponse group = studentGroupService.getGroupByUuid(groupUuid);
        return ResponseEntity.ok(ApiResponse.success("Group retrieved", group));
    }

    // ─── PUT /api/v1/admin/groups/{groupUuid} ────────────

    @PutMapping("/{groupUuid}")
    public ResponseEntity<ApiResponse<GroupResponse>> updateGroup(
            @PathVariable String groupUuid,
            @RequestBody @Valid UpdateGroupRequest request) {

        GroupResponse group = studentGroupService.updateGroup(groupUuid, request);
        return ResponseEntity.ok(ApiResponse.success("Group updated", group));
    }

    // ─── DELETE /api/v1/admin/groups/{groupUuid} ─────────

    @DeleteMapping("/{groupUuid}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable String groupUuid) {

        studentGroupService.deleteGroup(groupUuid);
        return ResponseEntity.ok(ApiResponse.success("Group deleted"));
    }

    // ─── POST /api/v1/admin/groups/{groupUuid}/members ───

    @PostMapping("/{groupUuid}/members")
    public ResponseEntity<ApiResponse<AddMembersResponse>> addMembers(
            @PathVariable String groupUuid,
            @RequestBody @Valid AddMembersRequest request) {

        AddMembersResponse response = studentGroupService.addMembers(groupUuid, request);
        return ResponseEntity.ok(ApiResponse.success("Members processed", response));
    }

    // ─── DELETE /api/v1/admin/groups/{groupUuid}/members/{userUuid} ─

    @DeleteMapping("/{groupUuid}/members/{userUuid}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable String groupUuid,
            @PathVariable String userUuid) {

        studentGroupService.removeMember(groupUuid, userUuid);
        return ResponseEntity.ok(ApiResponse.success("Member removed"));
    }

    // ─── GET /api/v1/admin/groups/{groupUuid}/members ────

    @GetMapping("/{groupUuid}/members")
    public ResponseEntity<ApiResponse<List<GroupMemberResponse>>> getGroupMembers(
            @PathVariable String groupUuid) {

        List<GroupMemberResponse> members = studentGroupService.getGroupMembers(groupUuid);
        return ResponseEntity.ok(ApiResponse.success("Group members retrieved", members));
    }

    // ─── Helper ──────────────────────────────────────────

    private String extractEmail(Authentication authentication) {
        return ((UserDetails) authentication.getPrincipal()).getUsername();
    }
}
