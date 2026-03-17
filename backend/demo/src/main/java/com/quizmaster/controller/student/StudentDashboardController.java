package com.quizmaster.controller.student;

import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.AvailableQuizResponse;
import com.quizmaster.dto.response.StudentDashboardResponse;
import com.quizmaster.service.StudentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Student Dashboard controller.
 *
 * Base path /api/v1/student is shared with {@link StudentQuizController}.
 * Routes in this controller:
 *   GET /api/v1/student/quizzes
 *   GET /api/v1/student/quizzes/{quizUuid}
 *   GET /api/v1/student/dashboard
 *
 * These do NOT conflict with StudentQuizController which uses:
 *   POST /api/v1/student/quizzes/{quizUuid}/start
 *   POST /api/v1/student/attempts/{attemptUuid}/answer
 *   GET  /api/v1/student/attempts/{attemptUuid}
 *   etc.
 */
@RestController
@RequestMapping("/api/v1/student")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class StudentDashboardController {

    private final StudentDashboardService studentDashboardService;

    // ─── Available quizzes (paginated) ───────────────────

    @GetMapping("/quizzes")
    public ResponseEntity<ApiResponse<Page<AvailableQuizResponse>>> getAvailableQuizzes(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        String email = extractEmail(authentication);
        Page<AvailableQuizResponse> quizzes =
                studentDashboardService.getAvailableQuizzes(email, pageable);
        return ResponseEntity.ok(ApiResponse.success("Available quizzes retrieved", quizzes));
    }

    // ─── Single quiz detail ──────────────────────────────

    @GetMapping("/quizzes/{quizUuid}")
    public ResponseEntity<ApiResponse<AvailableQuizResponse>> getQuizDetail(
            @PathVariable String quizUuid,
            Authentication authentication) {

        String email = extractEmail(authentication);
        AvailableQuizResponse quiz =
                studentDashboardService.getQuizDetail(quizUuid, email);
        return ResponseEntity.ok(ApiResponse.success("Quiz details retrieved", quiz));
    }

    // ─── Student dashboard summary ───────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<StudentDashboardResponse>> getStudentDashboard(
            Authentication authentication) {

        String email = extractEmail(authentication);
        StudentDashboardResponse dashboard =
                studentDashboardService.getStudentDashboard(email);
        return ResponseEntity.ok(ApiResponse.success("Dashboard retrieved", dashboard));
    }

    // ─── Helper ──────────────────────────────────────────

    private String extractEmail(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
