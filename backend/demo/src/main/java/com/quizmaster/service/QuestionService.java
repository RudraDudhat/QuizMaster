package com.quizmaster.service;

import com.quizmaster.dto.request.CreateQuestionRequest;
import com.quizmaster.dto.request.OptionRequest;
import com.quizmaster.dto.request.UpdateQuestionRequest;
import com.quizmaster.dto.response.QuestionResponse;
import com.quizmaster.entity.Question;
import com.quizmaster.entity.QuestionOption;
import com.quizmaster.entity.Tag;
import com.quizmaster.entity.User;
import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.mapper.QuestionMapper;
import com.quizmaster.repository.QuestionRepository;
import com.quizmaster.repository.TagRepository;
import com.quizmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final QuestionMapper questionMapper;

    // ─── CREATE ─────────────────────────────────────────

    @Transactional
    public QuestionResponse createQuestion(CreateQuestionRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Set<Tag> tags = resolveTags(request.getTagUuids());

        Question question = questionMapper.toEntity(request);
        question.setCreatedBy(admin);
        question.setTags(tags);

        question = questionRepository.save(question);

        // Add options (need parent reference)
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            addOptionsToQuestion(question, request.getOptions());
            question = questionRepository.save(question);
        }

        return questionMapper.toResponse(question);
    }

    // ─── READ ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(UUID uuid) {
        Question question = questionRepository.findByUuidWithOptionsAndTags(uuid)
                .orElseThrow(() -> new BadRequestException("Question not found"));
        return questionMapper.toResponse(question);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getAllQuestions(Pageable pageable) {
        return questionRepository.findByDeletedAtIsNull(pageable).map(questionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getQuestionsByType(QuestionType type, Pageable pageable) {
        return questionRepository.findByQuestionTypeAndDeletedAtIsNull(type, pageable).map(questionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getQuestionsByDifficulty(DifficultyLevel difficulty, Pageable pageable) {
        return questionRepository.findByDifficultyAndDeletedAtIsNull(difficulty, pageable)
                .map(questionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getQuestionsByTag(UUID tagUuid, Pageable pageable) {
        return questionRepository.findByTagUuidAndDeletedAtIsNull(tagUuid, pageable).map(questionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> searchQuestions(String keyword, Pageable pageable) {
        return questionRepository.searchByKeyword(keyword, pageable).map(questionMapper::toResponse);
    }

    // ─── UPDATE ─────────────────────────────────────────

    @Transactional
    public QuestionResponse updateQuestion(UUID uuid, UpdateQuestionRequest request) {
        Question question = questionRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Question not found"));
        return doUpdateQuestion(question, request);
    }

    private QuestionResponse doUpdateQuestion(Question question, UpdateQuestionRequest request) {
        // MapStruct handles null-skipping for all scalar fields
        questionMapper.updateEntityFromRequest(request, question);

        // Tags require manual resolution (M2M lookup)
        if (request.getTagUuids() != null) {
            question.setTags(resolveTags(request.getTagUuids()));
        }

        // Replace options if provided (needs parent reference)
        if (request.getOptions() != null) {
            question.getOptions().clear();
            addOptionsToQuestion(question, request.getOptions());
        }

        question = questionRepository.save(question);
        return questionMapper.toResponse(question);
    }

    // ─── SOFT DELETE ────────────────────────────────────

    @Transactional
    public void softDeleteQuestion(UUID uuid) {
        Question question = questionRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Question not found"));
        question.setDeletedAt(Instant.now());
        questionRepository.save(question);
    }

    // ─── TAG MANAGEMENT ─────────────────────────────────

    @Transactional
    public QuestionResponse addTags(UUID questionUuid, Set<UUID> tagUuids) {
        Question question = questionRepository.findByUuidAndDeletedAtIsNull(questionUuid)
                .orElseThrow(() -> new BadRequestException("Question not found"));
        Set<Tag> newTags = resolveTags(tagUuids);
        question.getTags().addAll(newTags);
        question = questionRepository.save(question);
        return questionMapper.toResponse(question);
    }

    @Transactional
    public QuestionResponse removeTags(UUID questionUuid, Set<UUID> tagUuids) {
        Question question = questionRepository.findByUuidAndDeletedAtIsNull(questionUuid)
                .orElseThrow(() -> new BadRequestException("Question not found"));
        question.getTags().removeIf(tag -> tagUuids.contains(tag.getUuid()));
        question = questionRepository.save(question);
        return questionMapper.toResponse(question);
    }

    // ─── HELPERS ────────────────────────────────────────

    private void addOptionsToQuestion(Question question, List<OptionRequest> optionRequests) {
        int order = 1;
        for (OptionRequest optReq : optionRequests) {
            QuestionOption option = QuestionOption.builder()
                    .question(question)
                    .optionText(optReq.getOptionText())
                    .optionOrder(optReq.getOptionOrder() != null ? optReq.getOptionOrder() : order)
                    .isCorrect(optReq.getIsCorrect() != null ? optReq.getIsCorrect() : false)
                    .mediaUrl(optReq.getMediaUrl())
                    .matchPairKey(optReq.getMatchPairKey())
                    .matchPairVal(optReq.getMatchPairVal())
                    .build();
            question.getOptions().add(option);
            order++;
        }
    }

    private Set<Tag> resolveTags(Set<UUID> tagUuids) {
        if (tagUuids == null || tagUuids.isEmpty())
            return new HashSet<>();
        return tagRepository.findByUuidIn(tagUuids);
    }
}
