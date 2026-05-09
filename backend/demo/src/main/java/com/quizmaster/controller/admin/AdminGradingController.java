package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.GradeEssayRequest;
import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.AttemptReviewResponse;
import com.quizmaster.dto.response.PendingReviewResponse;
import com.quizmaster.service.AttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Admin endpoints for grading essay (manual-review) answers.
 *
 *   GET  /api/v1/admin/grading/pending           — queue
 *   GET  /api/v1/admin/grading/{attemptUuid}     — full review for grading
 *   POST /api/v1/admin/grading/{attemptUuid}/questions/{questionUuid}/grade
 */
@RestController
@RequestMapping("/api/v1/admin/grading")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminGradingController {

    private final AttemptService attemptService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<PendingReviewResponse>>> listPending(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PendingReviewResponse> page = attemptService.listPendingReviews(pageable);
        return ResponseEntity.ok(ApiResponse.success("Pending reviews fetched", page));
    }

    @GetMapping("/{attemptUuid}")
    public ResponseEntity<ApiResponse<AttemptReviewResponse>> getAttemptReview(
            @PathVariable String attemptUuid) {
        AttemptReviewResponse review = attemptService.getAttemptReviewAdmin(attemptUuid);
        return ResponseEntity.ok(ApiResponse.success("Attempt review fetched", review));
    }

    @PostMapping("/{attemptUuid}/questions/{questionUuid}/grade")
    public ResponseEntity<ApiResponse<Void>> gradeEssay(
            @PathVariable String attemptUuid,
            @PathVariable String questionUuid,
            @RequestBody @Valid GradeEssayRequest request,
            @AuthenticationPrincipal UserDetails user) {
        attemptService.gradeEssayAnswer(attemptUuid, questionUuid, request, user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Answer graded", null));
    }
}
