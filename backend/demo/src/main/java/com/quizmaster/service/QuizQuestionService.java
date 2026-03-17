package com.quizmaster.service;

import com.quizmaster.dto.request.AddQuestionToQuizRequest;
import com.quizmaster.dto.request.ReorderQuestionsRequest;
import com.quizmaster.dto.response.QuizQuestionResponse;
import com.quizmaster.entity.Question;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.QuizQuestion;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.mapper.QuizQuestionMapper;
import com.quizmaster.repository.QuestionRepository;
import com.quizmaster.repository.QuizQuestionRepository;
import com.quizmaster.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizQuestionService {

    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizQuestionMapper quizQuestionMapper;

    // ─── ADD QUESTION TO QUIZ ──────────────────────────

    @Transactional
    public QuizQuestionResponse addQuestionToQuiz(UUID quizUuid, AddQuestionToQuizRequest request) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(quizUuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));

        Question question = questionRepository.findByUuidAndDeletedAtIsNull(request.getQuestionUuid())
                .orElseThrow(() -> new BadRequestException("Question not found"));

        // Check for duplicate link
        quizQuestionRepository.findByQuizIdAndQuestionId(quiz.getId(), question.getId())
                .ifPresent(existing -> {
                    throw new BadRequestException("Question is already linked to this quiz");
                });

        QuizQuestion quizQuestion = QuizQuestion.builder()
                .quiz(quiz)
                .question(question)
                .marks(request.getMarks())
                .negativeMarks(request.getNegativeMarks())
                .displayOrder(request.getDisplayOrder())
                .perQuestionSecs(request.getPerQuestionSecs())
                .isInPool(request.getIsInPool())
                .build();

        quizQuestion = quizQuestionRepository.save(quizQuestion);

        // Recalculate quiz totalMarks
        recalculateTotalMarks(quiz);

        return quizQuestionMapper.toResponse(quizQuestion);
    }

    // ─── REMOVE QUESTION FROM QUIZ ─────────────────────

    @Transactional
    public void removeQuestionFromQuiz(UUID quizUuid, UUID questionUuid) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(quizUuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));

        Question question = questionRepository.findByUuidAndDeletedAtIsNull(questionUuid)
                .orElseThrow(() -> new BadRequestException("Question not found"));

        quizQuestionRepository.findByQuizIdAndQuestionId(quiz.getId(), question.getId())
                .orElseThrow(() -> new BadRequestException("Question is not linked to this quiz"));

        quizQuestionRepository.deleteByQuizIdAndQuestionId(quiz.getId(), question.getId());

        // Recalculate quiz totalMarks
        recalculateTotalMarks(quiz);
    }

    // ─── GET QUESTIONS FOR QUIZ ────────────────────────

    @Transactional(readOnly = true)
    public List<QuizQuestionResponse> getQuestionsForQuiz(UUID quizUuid) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(quizUuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));

        return quizQuestionRepository.findByQuizIdOrderByDisplayOrder(quiz.getId())
                .stream()
                .map(quizQuestionMapper::toResponse)
                .collect(Collectors.toList());
    }

    // ─── REORDER QUESTIONS ─────────────────────────────

    @Transactional
    public void reorderQuestions(UUID quizUuid, ReorderQuestionsRequest request) {
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(quizUuid)
                .orElseThrow(() -> new BadRequestException("Quiz not found"));

        List<UUID> orderedUuids = request.getOrderedQuizQuestionUuids();
        for (int i = 0; i < orderedUuids.size(); i++) {
            QuizQuestion qq = quizQuestionRepository.findByUuid(orderedUuids.get(i))
                    .orElseThrow(() -> new BadRequestException("QuizQuestion not found"));

            if (!qq.getQuiz().getId().equals(quiz.getId())) {
                throw new BadRequestException("QuizQuestion does not belong to this quiz");
            }

            qq.setDisplayOrder(i + 1);
            quizQuestionRepository.save(qq);
        }
    }

    // ─── HELPERS ───────────────────────────────────────

    private void recalculateTotalMarks(Quiz quiz) {
        quiz.setTotalMarks(quizQuestionRepository.sumMarksByQuizId(quiz.getId()));
        quizRepository.save(quiz);
    }
}
