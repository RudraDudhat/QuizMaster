package com.quizmaster.mapper;

import com.quizmaster.dto.request.SaveAnswerRequest;
import com.quizmaster.dto.response.*;
import com.quizmaster.entity.*;
import com.quizmaster.enums.AttemptStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface AttemptMapper {

    // ═══════════════════════════════════════════════════════
    // ENTITY → DTO MAPPINGS
    // ═══════════════════════════════════════════════════════

    // ─── QuizAttempt → SubmitAttemptResponse ─────────────

    @Mapping(target = "attemptUuid", expression = "java(attempt.getUuid().toString())")
    @Mapping(target = "quizUuid", expression = "java(attempt.getQuiz().getUuid().toString())")
    @Mapping(target = "quizTitle", source = "quiz.title")
    @Mapping(target = "passMarks", source = "quiz.passMarks")
    @Mapping(target = "status", expression = "java(attempt.getStatus().name())")
    @Mapping(target = "timeTakenSeconds", ignore = true) // computed in @AfterMapping
    SubmitAttemptResponse toSubmitResponse(QuizAttempt attempt);

    @AfterMapping
    default void computeTimeTaken(QuizAttempt attempt, @MappingTarget SubmitAttemptResponse response) {
        if (attempt.getSubmittedAt() != null && attempt.getStartedAt() != null) {
            response.setTimeTakenSeconds(
                    Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds());
        }
    }

    // ─── QuizAttempt → AttemptResultResponse ────────────

    @Mapping(target = "attemptUuid", expression = "java(attempt.getUuid().toString())")
    @Mapping(target = "quizUuid", expression = "java(attempt.getQuiz().getUuid().toString())")
    @Mapping(target = "quizTitle", source = "attempt.quiz.title")
    @Mapping(target = "passMarks", source = "attempt.quiz.passMarks")
    @Mapping(target = "status", expression = "java(attempt.getStatus().name())")
    @Mapping(target = "timeTakenSeconds", ignore = true) // computed in @AfterMapping
    @Mapping(target = "correctCount", source = "correctCount")
    @Mapping(target = "wrongCount", source = "wrongCount")
    @Mapping(target = "skippedCount", source = "skippedCount")
    @Mapping(target = "marksObtained", source = "attempt.marksObtained")
    @Mapping(target = "totalMarksPossible", source = "attempt.totalMarksPossible")
    @Mapping(target = "percentage", source = "attempt.percentage")
    @Mapping(target = "isPassed", source = "attempt.isPassed")
    @Mapping(target = "submittedAt", source = "attempt.submittedAt")
    @Mapping(target = "attemptNumber", source = "attempt.attemptNumber")
    @Mapping(target = "rank", source = "attempt.rank")
    @Mapping(target = "positiveMarks", source = "attempt.positiveMarks")
    @Mapping(target = "negativeMarksDeducted", source = "attempt.negativeMarksDeducted")
    AttemptResultResponse toResultResponse(QuizAttempt attempt, int correctCount, int wrongCount, int skippedCount);

    @AfterMapping
    default void computeResultTimeTaken(QuizAttempt attempt, @MappingTarget AttemptResultResponse response) {
        if (attempt.getSubmittedAt() != null && attempt.getStartedAt() != null) {
            response.setTimeTakenSeconds(
                    Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds());
        }
    }

    // ─── QuizAttempt → AttemptHistoryResponse ───────────

    @Mapping(target = "attemptUuid", expression = "java(attempt.getUuid().toString())")
    @Mapping(target = "quizUuid", expression = "java(attempt.getQuiz().getUuid().toString())")
    @Mapping(target = "quizTitle", source = "quiz.title")
    @Mapping(target = "status", expression = "java(attempt.getStatus().name())")
    @Mapping(target = "timeTakenSeconds", ignore = true) // computed in @AfterMapping
    AttemptHistoryResponse toHistoryResponse(QuizAttempt attempt);

    @AfterMapping
    default void computeHistoryTimeTaken(QuizAttempt attempt, @MappingTarget AttemptHistoryResponse response) {
        if (attempt.getSubmittedAt() != null && attempt.getStartedAt() != null) {
            response.setTimeTakenSeconds(
                    Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds());
        }
    }

    // ═══════════════════════════════════════════════════════
    // START ATTEMPT RESPONSE MAPPINGS
    // ═══════════════════════════════════════════════════════

    // ─── QuestionOption → StartAttemptResponse.OptionDto (NO isCorrect) ──

    @Named("toStudentOptionDto")
    @Mapping(target = "optionOrder", source = "optionOrder")
    StartAttemptResponse.OptionDto toStudentOptionDto(QuestionOption option);

    @Named("toStudentOptionDtoList")
    default List<StartAttemptResponse.OptionDto> toStudentOptionDtoList(Set<QuestionOption> options) {
        if (options == null)
            return Collections.emptyList();
        return options.stream()
                .sorted(Comparator.comparingInt(QuestionOption::getOptionOrder))
                .map(this::toStudentOptionDto)
                .collect(Collectors.toList());
    }

    // ─── QuizQuestion → StartAttemptResponse.AttemptQuestionDto ──

    @Mapping(target = "quizQuestionUuid", source = "uuid")
    @Mapping(target = "questionUuid", expression = "java(qq.getQuestion() != null && qq.getQuestion().getUuid() != null ? qq.getQuestion().getUuid().toString() : null)")
    @Mapping(target = "questionText", source = "question.questionText")
    @Mapping(target = "questionType", expression = "java(qq.getQuestion() != null && qq.getQuestion().getQuestionType() != null ? qq.getQuestion().getQuestionType().name() : null)")
    @Mapping(target = "difficulty", expression = "java(qq.getQuestion() != null && qq.getQuestion().getDifficulty() != null ? qq.getQuestion().getDifficulty().name() : null)")
    @Mapping(target = "marks", source = "marks")
    @Mapping(target = "negativeMarks", source = "negativeMarks")
    @Mapping(target = "perQuestionSecs", source = "perQuestionSecs")
    @Mapping(target = "displayOrder", source = "displayOrder")
    @Mapping(target = "hintText", source = "question.hintText")
    @Mapping(target = "mediaUrl", source = "question.mediaUrl")
    @Mapping(target = "codeContent", source = "question.codeContent")
    @Mapping(target = "codeLanguage", source = "question.codeLanguage")
    @Mapping(target = "options", source = "question.options", qualifiedByName = "toStudentOptionDtoList")
    StartAttemptResponse.AttemptQuestionDto toAttemptQuestionDto(QuizQuestion qq);

    default List<StartAttemptResponse.AttemptQuestionDto> toAttemptQuestionDtoList(List<QuizQuestion> questions) {
        if (questions == null)
            return Collections.emptyList();
        return questions.stream()
                .map(this::toAttemptQuestionDto)
                .collect(Collectors.toList());
    }

    // ─── Build StartAttemptResponse from attempt + quiz + questions ──

    default StartAttemptResponse toStartResponse(QuizAttempt attempt, Quiz quiz,
            List<QuizQuestion> servedQuestions) {
        return StartAttemptResponse.builder()
                .attemptUuid(attempt.getUuid().toString())
                .quizUuid(quiz.getUuid().toString())
                .quizTitle(quiz.getTitle())
                .deadlineAt(attempt.getDeadlineAt())
                .timeLimitSeconds(quiz.getTimeLimitSeconds())
                .questions(toAttemptQuestionDtoList(servedQuestions))
                .build();
    }

    // ═══════════════════════════════════════════════════════
    // REVIEW RESPONSE MAPPINGS
    // ═══════════════════════════════════════════════════════

    // ─── QuestionOption → ReviewOptionDto (WITH isCorrect shown) ──

    @Named("toReviewOptionDto")
    StartAttemptResponse.OptionDto toReviewOptionDtoBase(QuestionOption option);

    @Named("toReviewOptionDtoList")
    default List<AttemptReviewResponse.ReviewOptionDto> toReviewOptionDtoList(Set<QuestionOption> options) {
        if (options == null)
            return Collections.emptyList();
        return options.stream()
                .sorted(Comparator.comparingInt(QuestionOption::getOptionOrder))
                .map(this::toReviewOptionDto)
                .collect(Collectors.toList());
    }

    @Named("toReviewOptionDtoSingle")
    default AttemptReviewResponse.ReviewOptionDto toReviewOptionDto(QuestionOption o) {
        return AttemptReviewResponse.ReviewOptionDto.builder()
                .uuid(o.getUuid())
                .optionText(o.getOptionText())
                .mediaUrl(o.getMediaUrl())
                .optionOrder(o.getOptionOrder())
                .isCorrect(o.getIsCorrect())
                .build();
    }

    // ─── AttemptAnswer → ReviewQuestionDto ──

    default AttemptReviewResponse.ReviewQuestionDto toReviewQuestionDto(
            AttemptAnswer ans, java.util.function.Function<String, List<UUID>> jsonParser) {
        Question question = ans.getQuestion();
        QuizQuestion qq = ans.getQuizQuestion();

        List<UUID> correctOptionUuids = question.getOptions().stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .map(QuestionOption::getUuid)
                .collect(Collectors.toList());

        List<UUID> studentSelectedUuids = jsonParser.apply(ans.getSelectedOptionIds());

        return AttemptReviewResponse.ReviewQuestionDto.builder()
                .questionUuid(question.getUuid().toString())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType().name())
                .marks(qq.getMarks())
                .marksAwarded(ans.getMarksAwarded())
                .studentSelectedOptionUuids(studentSelectedUuids)
                .correctOptionUuids(correctOptionUuids)
                .textAnswer(ans.getTextAnswer())
                .isCorrect(ans.getIsCorrect())
                .isSkipped(ans.getIsSkipped())
                .hintUsed(ans.getHintUsed())
                .timeSpentSeconds(ans.getTimeSpentSeconds())
                .explanation(question.getExplanation())
                .codeContent(question.getCodeContent())
                .codeLanguage(question.getCodeLanguage())
                .mediaUrl(question.getMediaUrl())
                .options(toReviewOptionDtoList(question.getOptions()))
                .build();
    }

    // ─── Build AttemptReviewResponse ──

    default AttemptReviewResponse toReviewResponse(QuizAttempt attempt, List<AttemptAnswer> answers,
            java.util.function.Function<String, List<UUID>> jsonParser) {
        List<AttemptReviewResponse.ReviewQuestionDto> reviewQuestions = answers.stream()
                .map(ans -> toReviewQuestionDto(ans, jsonParser))
                .collect(Collectors.toList());

        return AttemptReviewResponse.builder()
                .attemptUuid(attempt.getUuid().toString())
                .quizTitle(attempt.getQuiz().getTitle())
                .questions(reviewQuestions)
                .build();
    }

    // ═══════════════════════════════════════════════════════
    // DTO → ENTITY MAPPINGS
    // ═══════════════════════════════════════════════════════

    // ─── SaveAnswerRequest → AttemptAnswer (new) ────────

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "attempt", ignore = true)
    @Mapping(target = "quizQuestion", ignore = true)
    @Mapping(target = "question", ignore = true)
    @Mapping(target = "isCorrect", ignore = true)
    @Mapping(target = "marksAwarded", ignore = true)
    @Mapping(target = "manualGradeNote", ignore = true)
    @Mapping(target = "gradedBy", ignore = true)
    @Mapping(target = "gradedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isSkipped", ignore = true)
    @Mapping(target = "answeredAt", ignore = true)
    @Mapping(target = "selectedOptionIds", ignore = true) // JSON conversion in service
    @Mapping(target = "orderedOptionIds", ignore = true) // JSON conversion in service
    @Mapping(target = "matchPairs", ignore = true) // JSON conversion in service
    AttemptAnswer toAnswer(SaveAnswerRequest request);

    // ─── Update existing AttemptAnswer from request ─────

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "attempt", ignore = true)
    @Mapping(target = "quizQuestion", ignore = true)
    @Mapping(target = "question", ignore = true)
    @Mapping(target = "isCorrect", ignore = true)
    @Mapping(target = "marksAwarded", ignore = true)
    @Mapping(target = "manualGradeNote", ignore = true)
    @Mapping(target = "gradedBy", ignore = true)
    @Mapping(target = "gradedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isSkipped", ignore = true)
    @Mapping(target = "answeredAt", ignore = true)
    @Mapping(target = "selectedOptionIds", ignore = true)
    @Mapping(target = "orderedOptionIds", ignore = true)
    @Mapping(target = "matchPairs", ignore = true)
    void updateAnswerFromRequest(SaveAnswerRequest request, @MappingTarget AttemptAnswer answer);

    // ─── Post-mapping: compute isSkipped & answeredAt ───

    @AfterMapping
    default void computeAnswerMeta(SaveAnswerRequest request, @MappingTarget AttemptAnswer answer) {
        boolean empty = (request.getSelectedOptionUuids() == null || request.getSelectedOptionUuids().isEmpty())
                && (request.getTextAnswer() == null || request.getTextAnswer().isBlank())
                && request.getBooleanAnswer() == null
                && (request.getOrderedOptionUuids() == null || request.getOrderedOptionUuids().isEmpty())
                && (request.getMatchPairs() == null || request.getMatchPairs().isEmpty());
        answer.setIsSkipped(empty);
        answer.setAnsweredAt(empty ? null : Instant.now());

        // Default nulls
        if (answer.getHintUsed() == null)
            answer.setHintUsed(false);
        if (answer.getTimeSpentSeconds() == null)
            answer.setTimeSpentSeconds(0);
        if (answer.getIsFlagged() == null)
            answer.setIsFlagged(false);
    }

    // ─── SaveAnswerResponse ─────────────────────────────

    default SaveAnswerResponse toSaveAnswerResponse(UUID quizQuestionUuid) {
        return SaveAnswerResponse.builder()
                .quizQuestionUuid(quizQuestionUuid)
                .savedAt(Instant.now())
                .build();
    }
}
