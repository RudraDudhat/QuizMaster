package com.quizmaster.controller.student;

import com.quizmaster.dto.request.AuditLogRequest;
import com.quizmaster.dto.request.SaveAnswerRequest;
import com.quizmaster.dto.request.StartAttemptRequest;
import com.quizmaster.dto.response.*;
import com.quizmaster.service.AttemptService;
import com.quizmaster.util.HttpRequestUtils;
import jakarta.servlet.http.HttpServletRequest;
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

@RestController
@RequestMapping("/api/v1/student")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class StudentQuizController {

    private final AttemptService attemptService;

    // ─── START ATTEMPT ──────────────────────────────────

    @PostMapping("/quizzes/{quizUuid}/start")
    public ResponseEntity<ApiResponse<StartAttemptResponse>> startAttempt(
            @PathVariable String quizUuid,
            @RequestBody(required = false) StartAttemptRequest request,
            HttpServletRequest httpRequest,
            Authentication authentication) {
        String email = extractEmail(authentication);
        // Honour X-Forwarded-For so we log the real client IP when behind a
        // reverse proxy / load balancer, not just the proxy's address.
        String ipAddress = HttpRequestUtils.clientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String accessCode = request != null ? request.getAccessCode() : null;

        StartAttemptResponse response = attemptService.startAttempt(
                quizUuid, email, ipAddress, userAgent, accessCode);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attempt started", response));
    }

    // ─── SAVE ANSWER ────────────────────────────────────

    @PostMapping("/attempts/{attemptUuid}/answer")
    public ResponseEntity<ApiResponse<SaveAnswerResponse>> saveAnswer(
            @PathVariable String attemptUuid,
            @Valid @RequestBody SaveAnswerRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        SaveAnswerResponse response = attemptService.saveAnswer(attemptUuid, request, email);
        return ResponseEntity.ok(ApiResponse.success("Answer saved", response));
    }

    // ─── SUBMIT ATTEMPT ─────────────────────────────────

    @PostMapping("/attempts/{attemptUuid}/submit")
    public ResponseEntity<ApiResponse<SubmitAttemptResponse>> submitAttempt(
            @PathVariable String attemptUuid,
            Authentication authentication) {
        String email = extractEmail(authentication);
        SubmitAttemptResponse response = attemptService.submitAttempt(attemptUuid, email);
        return ResponseEntity.ok(ApiResponse.success("Attempt submitted", response));
    }

    // ─── GET ATTEMPT RESULT ─────────────────────────────

    @GetMapping("/attempts/{attemptUuid}/result")
    public ResponseEntity<ApiResponse<AttemptResultResponse>> getAttemptResult(
            @PathVariable String attemptUuid,
            Authentication authentication) {
        String email = extractEmail(authentication);
        AttemptResultResponse response = attemptService.getAttemptResult(attemptUuid, email);
        return ResponseEntity.ok(ApiResponse.success("Attempt result retrieved", response));
    }

    // ─── GET ATTEMPT REVIEW ─────────────────────────────

    @GetMapping("/attempts/{attemptUuid}/review")
    public ResponseEntity<ApiResponse<AttemptReviewResponse>> getAttemptReview(
            @PathVariable String attemptUuid,
            Authentication authentication) {
        String email = extractEmail(authentication);
        AttemptReviewResponse response = attemptService.getAttemptReview(attemptUuid, email);
        return ResponseEntity.ok(ApiResponse.success("Attempt review retrieved", response));
    }

    // ─── ATTEMPT HISTORY ────────────────────────────────

    @GetMapping("/attempts/history")
    public ResponseEntity<ApiResponse<Page<AttemptHistoryResponse>>> getAttemptHistory(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {
        String email = extractEmail(authentication);
        Page<AttemptHistoryResponse> history = attemptService.getAttemptHistory(email, pageable);
        return ResponseEntity.ok(ApiResponse.success("Attempt history retrieved", history));
    }

    // ─── LOG AUDIT EVENT ────────────────────────────────

    @PostMapping("/attempts/{attemptUuid}/audit")
    public ResponseEntity<ApiResponse<Void>> logAuditEvent(
            @PathVariable String attemptUuid,
            @Valid @RequestBody AuditLogRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        attemptService.logAuditEvent(attemptUuid, email, request);
        return ResponseEntity.ok(ApiResponse.success("Audit event logged"));
    }

    // ─── HELPER ─────────────────────────────────────────

    private String extractEmail(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
