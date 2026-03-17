package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.AddQuestionToQuizRequest;
import com.quizmaster.dto.request.ReorderQuestionsRequest;
import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.QuizQuestionResponse;
import com.quizmaster.service.QuizQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/quizzes/{quizUuid}/questions")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
@RequiredArgsConstructor
public class QuizQuestionController {

    private final QuizQuestionService quizQuestionService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuizQuestionResponse>> addQuestionToQuiz(
            @PathVariable String quizUuid,
            @Valid @RequestBody AddQuestionToQuizRequest request) {
        QuizQuestionResponse response = quizQuestionService.addQuestionToQuiz(
                UUID.fromString(quizUuid), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question added to quiz", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuizQuestionResponse>>> getQuestionsForQuiz(
            @PathVariable String quizUuid) {
        List<QuizQuestionResponse> questions = quizQuestionService.getQuestionsForQuiz(
                UUID.fromString(quizUuid));
        return ResponseEntity.ok(ApiResponse.success("Quiz questions retrieved", questions));
    }

    @DeleteMapping("/{questionUuid}")
    public ResponseEntity<ApiResponse<Void>> removeQuestionFromQuiz(
            @PathVariable String quizUuid,
            @PathVariable String questionUuid) {
        quizQuestionService.removeQuestionFromQuiz(
                UUID.fromString(quizUuid), UUID.fromString(questionUuid));
        return ResponseEntity.ok(ApiResponse.success("Question removed from quiz"));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderQuestions(
            @PathVariable String quizUuid,
            @Valid @RequestBody ReorderQuestionsRequest request) {
        quizQuestionService.reorderQuestions(UUID.fromString(quizUuid), request);
        return ResponseEntity.ok(ApiResponse.success("Questions reordered"));
    }
}
