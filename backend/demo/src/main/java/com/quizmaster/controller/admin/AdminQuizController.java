package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.CreateQuizRequest;
import com.quizmaster.dto.request.QuizStatusUpdateRequest;
import com.quizmaster.dto.request.UpdateQuizRequest;
import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.QuizResponse;
import com.quizmaster.dto.response.SelectableQuizDto;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/quizzes")
@RequiredArgsConstructor
public class AdminQuizController {

    private final QuizService quizService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(
            @Valid @RequestBody CreateQuizRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        QuizResponse response = quizService.createQuiz(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuizResponse>>> getAllQuizzes(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuizResponse> page = quizService.getAllQuizzes(pageable);
        return ResponseEntity.ok(ApiResponse.success("Quizzes retrieved", page));
    }

    @GetMapping("/selectable")
    public ResponseEntity<ApiResponse<List<SelectableQuizDto>>> getSelectableQuizzes() {
        List<SelectableQuizDto> quizzes = quizService.getSelectableQuizzes();
        return ResponseEntity.ok(ApiResponse.success("Selectable quizzes retrieved", quizzes));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<QuizResponse>>> getQuizzesByStatus(
            @PathVariable QuizStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuizResponse> page = quizService.getQuizzesByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Quizzes filtered by " + status, page));
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizById(@PathVariable String uuid) {
        QuizResponse response = quizService.getQuizById(UUID.fromString(uuid));
        return ResponseEntity.ok(ApiResponse.success("Quiz retrieved", response));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @PathVariable String uuid,
            @Valid @RequestBody UpdateQuizRequest request) {
        QuizResponse response = quizService.updateQuiz(UUID.fromString(uuid), request);
        return ResponseEntity.ok(ApiResponse.success("Quiz updated", response));
    }

    @PatchMapping("/{uuid}/status")
    public ResponseEntity<ApiResponse<QuizResponse>> updateStatus(
            @PathVariable String uuid,
            @Valid @RequestBody QuizStatusUpdateRequest request) {
        QuizResponse response = quizService.updateStatus(UUID.fromString(uuid), request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Quiz status updated to " + request.getStatus(), response));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable String uuid) {
        quizService.softDeleteQuiz(UUID.fromString(uuid));
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted"));
    }

    @PostMapping("/{uuid}/duplicate")
    public ResponseEntity<ApiResponse<QuizResponse>> duplicateQuiz(
            @PathVariable String uuid,
            Authentication authentication) {
        String email = extractEmail(authentication);
        QuizResponse response = quizService.duplicateQuiz(UUID.fromString(uuid), email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz duplicated", response));
    }

    private String extractEmail(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
