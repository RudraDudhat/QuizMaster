package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.CreateQuestionRequest;
import com.quizmaster.dto.request.UpdateQuestionRequest;
import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.BulkImportResponse;
import com.quizmaster.dto.response.QuestionResponse;
import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
import com.quizmaster.service.QuestionImportService;
import com.quizmaster.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;
    private final QuestionImportService questionImportService;

    // ─── CRUD ───────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @Valid @RequestBody CreateQuestionRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        QuestionResponse response = questionService.createQuestion(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getAllQuestions(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuestionResponse> page = questionService.getAllQuestions(pageable);
        return ResponseEntity.ok(ApiResponse.success("Questions retrieved", page));
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestionById(@PathVariable String uuid) {
        QuestionResponse response = questionService.getQuestionById(UUID.fromString(uuid));
        return ResponseEntity.ok(ApiResponse.success("Question retrieved", response));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable String uuid,
            @Valid @RequestBody UpdateQuestionRequest request) {
        QuestionResponse response = questionService.updateQuestion(UUID.fromString(uuid), request);
        return ResponseEntity.ok(ApiResponse.success("Question updated", response));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable String uuid) {
        questionService.softDeleteQuestion(UUID.fromString(uuid));
        return ResponseEntity.ok(ApiResponse.success("Question deleted"));
    }

    // ─── FILTERS ────────────────────────────────────────

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getByType(
            @PathVariable QuestionType type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuestionResponse> page = questionService.getQuestionsByType(type, pageable);
        return ResponseEntity.ok(ApiResponse.success("Questions filtered by " + type, page));
    }

    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getByDifficulty(
            @PathVariable DifficultyLevel difficulty,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuestionResponse> page = questionService.getQuestionsByDifficulty(difficulty, pageable);
        return ResponseEntity.ok(ApiResponse.success("Questions filtered by " + difficulty, page));
    }

    @GetMapping("/tag/{tagUuid}")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getByTag(
            @PathVariable UUID tagUuid,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuestionResponse> page = questionService.getQuestionsByTag(tagUuid, pageable);
        return ResponseEntity.ok(ApiResponse.success("Questions filtered by tag", page));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> searchQuestions(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QuestionResponse> page = questionService.searchQuestions(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success("Search results", page));
    }

    // ─── TAG MANAGEMENT ─────────────────────────────────

    @PostMapping("/{uuid}/tags")
    public ResponseEntity<ApiResponse<QuestionResponse>> addTags(
            @PathVariable String uuid,
            @RequestBody Set<UUID> tagUuids) {
        QuestionResponse response = questionService.addTags(UUID.fromString(uuid), tagUuids);
        return ResponseEntity.ok(ApiResponse.success("Tags added", response));
    }

    @DeleteMapping("/{uuid}/tags")
    public ResponseEntity<ApiResponse<QuestionResponse>> removeTags(
            @PathVariable String uuid,
            @RequestBody Set<UUID> tagUuids) {
        QuestionResponse response = questionService.removeTags(UUID.fromString(uuid), tagUuids);
        return ResponseEntity.ok(ApiResponse.success("Tags removed", response));
    }

    // ─── BULK IMPORT ────────────────────────────────────

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BulkImportResponse>> importFromCsv(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("CSV file is empty"));
        }

        String email = extractEmail(authentication);
        BulkImportResponse result = questionImportService.importFromCsv(file, email);
        return ResponseEntity.ok(ApiResponse.success(
                "Import complete: " + result.getSuccessCount() + "/" + result.getTotalRows() + " succeeded",
                result));
    }

    private String extractEmail(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
