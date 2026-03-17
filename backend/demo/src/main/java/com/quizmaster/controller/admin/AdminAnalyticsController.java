package com.quizmaster.controller.admin;

import com.quizmaster.dto.response.*;
import com.quizmaster.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/v1/admin/analytics/quiz/{quizUuid}
     * Returns full analytics for a quiz: score distribution, per-question accuracy,
     * completion rate, average time, pass/fail rates, and anti-cheat summary.
     */
    @GetMapping("/quiz/{quizUuid}")
    public ResponseEntity<ApiResponse<QuizAnalyticsResponse>> getQuizAnalytics(
            @PathVariable String quizUuid) {
        QuizAnalyticsResponse analytics = analyticsService.getQuizAnalytics(UUID.fromString(quizUuid));
        return ResponseEntity.ok(ApiResponse.success("Quiz analytics retrieved", analytics));
    }

    // ─── GET /api/v1/admin/analytics/dashboard ────────────

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        AdminDashboardResponse dashboard = analyticsService.getAdminDashboard();
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", dashboard));
    }

    // ─── GET /api/v1/admin/analytics/students ─────────────

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<Page<StudentPerformanceRow>>> getAllStudentsPerformance(
            @PageableDefault(size = 20, sort = "totalAttempts", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<StudentPerformanceRow> rows = analyticsService.getAllStudentsPerformance(pageable);
        return ResponseEntity.ok(ApiResponse.success("Student performance data retrieved", rows));
    }

    // ─── GET /api/v1/admin/analytics/quiz/{quizUuid}/attempts ─

    @GetMapping("/quiz/{quizUuid}/attempts")
    public ResponseEntity<ApiResponse<Page<QuizAttemptListResponse>>> getAttemptsForQuiz(
            @PathVariable String quizUuid,
            @PageableDefault(size = 20, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuizAttemptListResponse> attempts = analyticsService.getAttemptsForQuiz(quizUuid, pageable);
        return ResponseEntity.ok(ApiResponse.success("Quiz attempts retrieved", attempts));
    }
}

