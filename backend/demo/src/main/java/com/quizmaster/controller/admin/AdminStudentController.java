package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.ResetAttemptsRequest;
import com.quizmaster.dto.request.UpdateStudentStatusRequest;
import com.quizmaster.dto.response.*;
import com.quizmaster.service.AdminStudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/students")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminStudentController {

    private final AdminStudentService adminStudentService;

    // ─── GET /api/v1/admin/students ──────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminStudentListResponse>>> getAllStudents(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String keyword) {

        Page<AdminStudentListResponse> students = adminStudentService.getAllStudents(pageable, keyword);
        return ResponseEntity.ok(ApiResponse.success("Students retrieved", students));
    }

    // ─── GET /api/v1/admin/students/{userUuid} ────────────

    @GetMapping("/{userUuid}")
    public ResponseEntity<ApiResponse<AdminStudentDetailResponse>> getStudentDetail(
            @PathVariable String userUuid) {

        AdminStudentDetailResponse detail = adminStudentService.getStudentDetail(userUuid);
        return ResponseEntity.ok(ApiResponse.success("Student details retrieved", detail));
    }

    // ─── PATCH /api/v1/admin/students/{userUuid}/status ───

    @PatchMapping("/{userUuid}/status")
    public ResponseEntity<ApiResponse<AdminStudentListResponse>> suspendStudent(
            @PathVariable String userUuid,
            @RequestBody @Valid UpdateStudentStatusRequest request) {

        AdminStudentListResponse updated = adminStudentService.suspendStudent(userUuid, request);
        String msg = Boolean.FALSE.equals(request.getIsActive())
                ? "Student suspended"
                : "Student reinstated";
        return ResponseEntity.ok(ApiResponse.success(msg, updated));
    }

    // ─── POST /api/v1/admin/students/{userUuid}/reset-attempts

    @PostMapping("/{userUuid}/reset-attempts")
    public ResponseEntity<ApiResponse<ResetAttemptsResponse>> resetAttempts(
            @PathVariable String userUuid,
            @RequestBody @Valid ResetAttemptsRequest request) {

        ResetAttemptsResponse response = adminStudentService.resetAttempts(userUuid, request);
        return ResponseEntity.ok(ApiResponse.success("Attempts reset successfully", response));
    }
}
