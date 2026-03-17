package com.quizmaster.service;

import com.quizmaster.dto.request.CreateQuizRequest;
import com.quizmaster.dto.request.UpdateQuizRequest;
import com.quizmaster.dto.response.QuizResponse;
import com.quizmaster.entity.Category;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.Tag;
import com.quizmaster.entity.User;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.mapper.QuizMapper;
import com.quizmaster.repository.CategoryRepository;
import com.quizmaster.repository.QuizRepository;
import com.quizmaster.repository.TagRepository;
import com.quizmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final QuizMapper quizMapper;

    // ─── CREATE ─────────────────────────────────────────

    @Transactional
    public QuizResponse createQuiz(CreateQuizRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Category category = null;
        if (request.getCategoryUuid() != null) {
            category = categoryRepository.findByUuidAndDeletedAtIsNull(request.getCategoryUuid())
                    .orElseThrow(() -> new BadRequestException("Category not found"));
        }

        Set<Tag> tags = resolveTags(request.getTagUuids());

        Quiz quiz = quizMapper.toEntity(request);
        quiz.setCreatedBy(admin);
        quiz.setCategory(category);
        quiz.setStatus(QuizStatus.DRAFT);
        quiz.setTags(tags);

        quiz = quizRepository.save(quiz);
        return quizMapper.toResponse(quiz);
    }

    // ─── READ ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public QuizResponse getQuizById(UUID uuid) {
        Quiz quiz = quizRepository.findByUuidWithTagsAndCategory(uuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        return quizMapper.toResponse(quiz);
    }

    @Transactional(readOnly = true)
    public Page<QuizResponse> getAllQuizzes(Pageable pageable) {
        return quizRepository.findByDeletedAtIsNull(pageable).map(quizMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuizResponse> getQuizzesByStatus(QuizStatus status, Pageable pageable) {
        return quizRepository.findByStatusAndDeletedAtIsNull(status, pageable).map(quizMapper::toResponse);
    }

    // ─── UPDATE ─────────────────────────────────────────

    @Transactional
    public QuizResponse updateQuiz(UUID uuid, UpdateQuizRequest request) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        return doUpdateQuiz(quiz, request);
    }

    private QuizResponse doUpdateQuiz(Quiz quiz, UpdateQuizRequest request) {
        // MapStruct handles null-skipping for all scalar fields
        quizMapper.updateEntityFromRequest(request, quiz);

        // Category requires manual resolution (FK lookup)
        if (request.getCategoryUuid() != null) {
            Category category = categoryRepository.findByUuidAndDeletedAtIsNull(request.getCategoryUuid())
                    .orElseThrow(() -> new BadRequestException("Category not found"));
            quiz.setCategory(category);
        }

        // Tags require manual resolution (M2M lookup)
        if (request.getTagUuids() != null) {
            quiz.setTags(resolveTags(request.getTagUuids()));
        }

        // Bump version
        quiz.setVersion(quiz.getVersion() + 1);

        quiz = quizRepository.save(quiz);
        return quizMapper.toResponse(quiz);
    }

    // ─── STATUS MANAGEMENT ──────────────────────────────

    @Transactional
    public QuizResponse updateStatus(UUID uuid, QuizStatus newStatus) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        return doUpdateStatus(quiz, newStatus);
    }

    private QuizResponse doUpdateStatus(Quiz quiz, QuizStatus newStatus) {
        validateStatusTransition(quiz.getStatus(), newStatus);
        quiz.setStatus(newStatus);
        quiz = quizRepository.save(quiz);
        return quizMapper.toResponse(quiz);
    }

    // ─── SOFT DELETE ────────────────────────────────────

    @Transactional
    public void softDeleteQuiz(UUID uuid) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        quiz.setDeletedAt(Instant.now());
        quiz.setStatus(QuizStatus.DELETED);
        quizRepository.save(quiz);
    }

    // ─── DUPLICATE ──────────────────────────────────────

    @Transactional
    public QuizResponse duplicateQuiz(UUID uuid, String adminEmail) {
        Quiz original = quizRepository.findByUuidWithTagsAndCategory(uuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        return doDuplicateQuiz(original, adminEmail);
    }

    private QuizResponse doDuplicateQuiz(Quiz original, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Quiz copy = Quiz.builder()
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .instructions(original.getInstructions())
                .category(original.getCategory())
                .createdBy(admin)
                .status(QuizStatus.DRAFT)
                .quizType(original.getQuizType())
                .difficulty(original.getDifficulty())
                .timerMode(original.getTimerMode())
                .timeLimitSeconds(original.getTimeLimitSeconds())
                .perQuestionSeconds(original.getPerQuestionSeconds())
                .gracePeriodSeconds(original.getGracePeriodSeconds())
                .totalMarks(original.getTotalMarks())
                .passMarks(original.getPassMarks())
                .negativeMarkingFactor(original.getNegativeMarkingFactor())
                .maxAttempts(original.getMaxAttempts())
                .cooldownHours(original.getCooldownHours())
                .accessCode(null)
                .startsAt(null)
                .expiresAt(null)
                .questionPoolSize(original.getQuestionPoolSize())
                .questionsToServe(original.getQuestionsToServe())
                .shuffleQuestions(original.getShuffleQuestions())
                .shuffleOptions(original.getShuffleOptions())
                .allowBackNavigation(original.getAllowBackNavigation())
                .showResultImmediately(original.getShowResultImmediately())
                .showCorrectAnswers(original.getShowCorrectAnswers())
                .showLeaderboard(original.getShowLeaderboard())
                .colorLabel(original.getColorLabel())
                .isPinned(false)
                .displayOrder(0)
                .tags(new HashSet<>(original.getTags()))
                .build();

        copy = quizRepository.save(copy);
        return quizMapper.toResponse(copy);
    }

    // ─── HELPERS ────────────────────────────────────────

    private void validateStatusTransition(QuizStatus current, QuizStatus target) {
        boolean valid = switch (current) {
            case DRAFT -> target == QuizStatus.PUBLISHED;
            case PUBLISHED -> target == QuizStatus.ARCHIVED || target == QuizStatus.DRAFT;
            case ARCHIVED -> target == QuizStatus.DRAFT;
            case DELETED -> false;
        };
        if (!valid) {
            throw new BadRequestException(
                    "Invalid status transition: " + current + " → " + target);
        }
    }

    private Set<Tag> resolveTags(Set<UUID> tagUuids) {
        if (tagUuids == null || tagUuids.isEmpty())
            return Collections.emptySet();
        return tagRepository.findByUuidIn(tagUuids);
    }
}
