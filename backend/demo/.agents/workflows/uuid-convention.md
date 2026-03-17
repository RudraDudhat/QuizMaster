---
description: UUID convention for all API endpoints — never expose Long IDs
---

# UUID Convention

**RULE**: All API path variables and controller parameters must use **UUID** (String), never Long IDs.

## Controller Pattern
- Path variables: `@PathVariable String quizUuid` (not `@PathVariable Long quizId`)
- Parse in controller: `UUID.fromString(quizUuid)`
- Pass `UUID` to service methods

## Service Pattern
- Public methods accept `UUID` parameters
- Resolve UUID → entity internally using `repository.findByUuidAndDeletedAtIsNull(uuid)`
- Use entity's Long ID internally for repository queries (e.g., join tables, sub-queries)
- **Never** expose Long IDs in the public API

## DTO Pattern
- Request DTOs with entity references should use UUID (not Long) for external-facing fields
- Internal join table IDs (like `quiz_question.id`) can remain Long since they are not entity UUIDs

## Example

```java
// Controller
@GetMapping("/{uuid}")
public ResponseEntity<ApiResponse<QuizResponse>> getQuizById(@PathVariable String uuid) {
    QuizResponse response = quizService.getQuizById(UUID.fromString(uuid));
    return ResponseEntity.ok(ApiResponse.success("Quiz retrieved", response));
}

// Service
public QuizResponse getQuizById(UUID uuid) {
    Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(uuid)
            .orElseThrow(() -> new BadRequestException("Quiz not found"));
    return quizMapper.toResponse(quiz);
}
```
