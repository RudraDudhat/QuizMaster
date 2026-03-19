package com.quizmaster.service;

import com.quizmaster.dto.request.CreateQuizRequest;
import com.quizmaster.dto.request.UpdateQuizRequest;
import com.quizmaster.dto.response.QuizResponse;
import com.quizmaster.dto.response.SelectableQuizDto;
import com.quizmaster.dto.response.QuizResponse.AssignedGroupSummary;
import com.quizmaster.entity.Category;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.QuizGroupAssignment;
import com.quizmaster.entity.StudentGroup;
import com.quizmaster.entity.Tag;
import com.quizmaster.entity.User;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.mapper.QuizMapper;
import com.quizmaster.repository.CategoryRepository;
import com.quizmaster.repository.QuizGroupAssignmentRepository;
import com.quizmaster.repository.QuizRepository;
import com.quizmaster.repository.StudentGroupRepository;
import com.quizmaster.repository.TagRepository;
import com.quizmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final QuizGroupAssignmentRepository quizGroupAssignmentRepository;
    private final QuizMapper quizMapper;

    @PersistenceContext
    private EntityManager entityManager;

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

        // Handle group assignments (optional)
        updateGroupAssignments(quiz, request.getGroupUuids(), admin);

        return toResponseWithGroups(quiz);
    }

    // ─── READ ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public QuizResponse getQuizById(UUID uuid) {
        Quiz quiz = quizRepository.findByUuidWithTagsAndCategory(uuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        return toResponseWithGroups(quiz);
    }

    @Transactional(readOnly = true)
    public Page<QuizResponse> getAllQuizzes(Pageable pageable) {
        Page<Quiz> page = quizRepository.findByDeletedAtIsNull(pageable);
        return page.map(this::toResponseWithGroups);
    }

    @Transactional(readOnly = true)
    public Page<QuizResponse> getQuizzesByStatus(QuizStatus status, Pageable pageable) {
        Page<Quiz> page = quizRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        return page.map(this::toResponseWithGroups);
    }

    @Transactional(readOnly = true)
    public List<SelectableQuizDto> getSelectableQuizzes() {
        List<QuizStatus> statuses = List.of(QuizStatus.DRAFT, QuizStatus.PUBLISHED);
        return quizRepository.findByStatusInAndDeletedAtIsNull(statuses).stream()
                .map(q -> new SelectableQuizDto(q.getUuid(), q.getTitle(), q.getStatus()))
                .collect(Collectors.toList());
    }

    // ─── UPDATE ─────────────────────────────────────────

    @Transactional
    public QuizResponse updateQuiz(UUID uuid, UpdateQuizRequest request, String adminEmail) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));
        return doUpdateQuiz(quiz, request, adminEmail);
    }

    private QuizResponse doUpdateQuiz(Quiz quiz, UpdateQuizRequest request, String adminEmail) {
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

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // Bump version
        quiz.setVersion(quiz.getVersion() + 1);

        quiz = quizRepository.save(quiz);

        // Handle group assignments (optional)
        updateGroupAssignments(quiz, request.getGroupUuids(), admin);

        return toResponseWithGroups(quiz);
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
        return toResponseWithGroups(quiz);
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
        return toResponseWithGroups(copy);
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

    private void updateGroupAssignments(Quiz quiz, Set<UUID> groupUuids, User admin) {
        // Remove existing assignments for this quiz
        entityManager.createQuery("DELETE FROM QuizGroupAssignment qga WHERE qga.quiz = :quiz")
                .setParameter("quiz", quiz)
                .executeUpdate();

        if (groupUuids == null || groupUuids.isEmpty()) {
            return;
        }

        for (UUID groupUuid : groupUuids) {
            StudentGroup group = studentGroupRepository.findByUuidAndDeletedAtIsNull(groupUuid.toString())
                    .orElseThrow(() -> new BadRequestException("Group not found"));
            QuizGroupAssignment assignment = QuizGroupAssignment.builder()
                    .quiz(quiz)
                    .group(group)
                    .assignedBy(admin)
                    .build();
            quizGroupAssignmentRepository.save(assignment);
        }
    }

    private QuizResponse toResponseWithGroups(Quiz quiz) {
        QuizResponse response = quizMapper.toResponse(quiz);

        List<StudentGroup> groups = entityManager.createQuery(
                        "SELECT qga.group FROM QuizGroupAssignment qga " +
                                "WHERE qga.quiz = :quiz", StudentGroup.class)
                .setParameter("quiz", quiz)
                .getResultList();

        Set<AssignedGroupSummary> assignedGroups = groups.stream()
                .map(g -> AssignedGroupSummary.builder()
                        .uuid(g.getUuid())
                        .name(g.getName())
                        .build())
                .collect(Collectors.toSet());

        response.setAssignedGroups(assignedGroups);
        return response;
    }
}
