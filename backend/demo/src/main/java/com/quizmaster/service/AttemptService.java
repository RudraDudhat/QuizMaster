package com.quizmaster.service;

import com.quizmaster.dto.request.AuditLogRequest;
import com.quizmaster.dto.request.SaveAnswerRequest;
import com.quizmaster.dto.response.*;
import com.quizmaster.entity.*;
import com.quizmaster.enums.AttemptStatus;
import com.quizmaster.enums.QuestionType;
import com.quizmaster.enums.QuizStatus;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.mapper.AttemptMapper;
import com.quizmaster.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttemptService {

    private final QuizAttemptRepository attemptRepository;
    private final AttemptAnswerRepository answerRepository;
    private final AttemptAuditLogRepository auditLogRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final NotificationService notificationService;
    private final AttemptMapper attemptMapper;
    private final ObjectMapper objectMapper;

    // ═══════════════════════════════════════════════════════
    // PUBLIC API (all accept UUID, never Long)
    // ═══════════════════════════════════════════════════════

    // ─── START ATTEMPT ──────────────────────────────────

    @Transactional
    public StartAttemptResponse startAttempt(String quizUuid, String studentEmail,
            String ipAddress, String userAgent, String accessCode) {
        User student = findUserByEmail(studentEmail);
        Quiz quiz = quizRepository.findByUuidAndDeletedAtIsNull(parseUuidOrThrow(quizUuid, "quizUuid"))
                .orElseThrow(() -> new BadRequestException("Quiz not found"));

        // 1. Verify quiz is published
        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new BadRequestException("Quiz is not available for attempts");
        }

        // 2. Verify time window
        Instant now = Instant.now();
        if (quiz.getStartsAt() != null && now.isBefore(quiz.getStartsAt())) {
            throw new BadRequestException("Quiz has not started yet. Starts at: " + quiz.getStartsAt());
        }
        if (quiz.getExpiresAt() != null && now.isAfter(quiz.getExpiresAt())) {
            throw new BadRequestException("Quiz has expired");
        }

        // 3. Validate access code
        if (quiz.getAccessCode() != null && !quiz.getAccessCode().isEmpty()) {
            if (accessCode == null || !quiz.getAccessCode().equals(accessCode)) {
                throw new BadRequestException("Invalid access code");
            }
        }

        // 4. Check for existing active attempt (resume)
        Optional<QuizAttempt> activeAttempt = attemptRepository.findActiveAttempt(quiz.getId(), student.getId());
        if (activeAttempt.isPresent()) {
            return buildStartResponse(activeAttempt.get(), quiz);
        }

        // 5. Validate attempt limits
        int attemptCount = attemptRepository.countValidAttempts(quiz.getId(), student.getId());
        if (quiz.getMaxAttempts() != null && quiz.getMaxAttempts() > 0 && attemptCount >= quiz.getMaxAttempts()) {
            throw new BadRequestException("Max attempts reached");
        }

        // 6. Validate cooldown
        if (quiz.getCooldownHours() != null && quiz.getCooldownHours() > 0 && attemptCount > 0) {
            Optional<Instant> lastSubmitted = attemptRepository.findLastSubmittedAt(quiz.getId(), student.getId());
            if (lastSubmitted.isPresent()) {
                Instant cooldownEnd = lastSubmitted.get().plus(Duration.ofHours(quiz.getCooldownHours()));
                if (now.isBefore(cooldownEnd)) {
                    long hoursLeft = Duration.between(now, cooldownEnd).toHours() + 1;
                    throw new BadRequestException("Cooldown active. Try again in " + hoursLeft + " hour(s)");
                }
            }
        }

        // 7. Calculate deadline
        Instant deadlineAt;
        if (quiz.getTimeLimitSeconds() != null && quiz.getTimeLimitSeconds() > 0) {
            int totalSeconds = quiz.getTimeLimitSeconds() +
                    (quiz.getGracePeriodSeconds() != null ? quiz.getGracePeriodSeconds() : 0);
            deadlineAt = now.plusSeconds(totalSeconds);
        } else {
            deadlineAt = quiz.getExpiresAt() != null ? quiz.getExpiresAt() : now.plusSeconds(86400);
        }

        // 8. Load and select questions
        List<QuizQuestion> quizQuestions = quizQuestionRepository.findByQuizIdWithQuestionsAndOptions(quiz.getId());
        if (quizQuestions.isEmpty()) {
            throw new BadRequestException("Quiz has no questions");
        }

        List<QuizQuestion> servedQuestions = selectQuestions(quiz, quizQuestions);

        BigDecimal totalMarksPossible = servedQuestions.stream()
                .map(QuizQuestion::getMarks)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String questionOrder = servedQuestions.stream()
                .map(qq -> String.valueOf(qq.getId()))
                .collect(Collectors.joining(","));

        // 9. Create attempt
        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .student(student)
                .attemptNumber(attemptCount + 1)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(now)
                .deadlineAt(deadlineAt)
                .totalMarksPossible(totalMarksPossible)
                .questionOrder(questionOrder)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        attempt = attemptRepository.save(attempt);

        // 10. Build response via mapper
        return attemptMapper.toStartResponse(attempt, quiz, servedQuestions);
    }

    // ─── SAVE ANSWER ────────────────────────────────────

    @Transactional
    public SaveAnswerResponse saveAnswer(String attemptUuid, SaveAnswerRequest request, String studentEmail) {
        User student = findUserByEmail(studentEmail);
        QuizAttempt attempt = attemptRepository.findByUuidAndStudentId(UUID.fromString(attemptUuid), student.getId())
                .orElseThrow(() -> new BadRequestException("Attempt not found"));

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Attempt is no longer active (status: " + attempt.getStatus() + ")");
        }

        if (attempt.getDeadlineAt() != null && Instant.now().isAfter(attempt.getDeadlineAt())) {
            autoSubmitAttempt(attempt);
            throw new BadRequestException("Time expired. Quiz has been auto-submitted.");
        }

        QuizQuestion quizQuestion = quizQuestionRepository.findByUuid(request.getQuizQuestionUuid())
                .orElseThrow(() -> new BadRequestException("Quiz question not found"));

        // Upsert answer
        AttemptAnswer answer = answerRepository
                .findByAttemptIdAndQuizQuestionId(attempt.getId(), quizQuestion.getId())
                .orElse(null);

        boolean wasHintUsed = answer != null && Boolean.TRUE.equals(answer.getHintUsed());

        if (answer == null) {
            // Map request → new entity via mapper
            answer = attemptMapper.toAnswer(request);
            answer.setAttempt(attempt);
            answer.setQuizQuestion(quizQuestion);
            answer.setQuestion(quizQuestion.getQuestion());
        } else {
            // Update existing entity via mapper
            attemptMapper.updateAnswerFromRequest(request, answer);
        }

        // Set JSON-serialized fields (List/Map → String)
        answer.setSelectedOptionIds(toJsonString(request.getSelectedOptionUuids()));
        answer.setOrderedOptionIds(toJsonString(request.getOrderedOptionUuids()));
        answer.setMatchPairs(toJsonString(request.getMatchPairs()));

        // Log hint reveal
        if (Boolean.TRUE.equals(request.getHintUsed()) && !wasHintUsed) {
            saveAuditLog(attempt, "HINT_REVEALED", null);
        }

        answerRepository.save(answer);

        return attemptMapper.toSaveAnswerResponse(request.getQuizQuestionUuid());
    }

    // ─── SUBMIT ATTEMPT ─────────────────────────────────

    @Transactional
    public SubmitAttemptResponse submitAttempt(String attemptUuid, String studentEmail) {
        User student = findUserByEmail(studentEmail);
        QuizAttempt attempt = attemptRepository.findByUuidAndStudentId(UUID.fromString(attemptUuid), student.getId())
                .orElseThrow(() -> new BadRequestException("Attempt not found"));

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Attempt already submitted or expired");
        }

        scoreAttempt(attempt);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        calculateRank(attempt);
        attemptRepository.saveAndFlush(attempt);
        attemptRepository.recomputeRanksForQuiz(attempt.getQuiz().getId());

        return attemptMapper.toSubmitResponse(attempt);
    }

    // ─── AUTO-SUBMIT (called by scheduler or deadline check) ──

    @Transactional
    public QuizAttempt autoSubmitAttempt(QuizAttempt attempt) {
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS)
            return attempt;

        createSkippedAnswers(attempt);
        scoreAttempt(attempt);
        attempt.setStatus(AttemptStatus.AUTO_SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        calculateRank(attempt);
        attemptRepository.saveAndFlush(attempt);
        attemptRepository.recomputeRanksForQuiz(attempt.getQuiz().getId());

        notificationService.sendAutoSubmitNotification(
                attempt.getStudent(),
                attempt.getQuiz().getTitle(),
                attempt.getUuid().toString(),
                attempt.getMarksObtained(),
                attempt.getTotalMarksPossible(),
                attempt.getPercentage());

        log.info("Auto-submitted attempt {} (quiz={}, student={})",
                attempt.getId(), attempt.getQuiz().getId(), attempt.getStudent().getId());
        return attempt;
    }

    // ─── GET ATTEMPT RESULT ─────────────────────────────

    @Transactional(readOnly = true)
    public AttemptResultResponse getAttemptResult(String attemptUuid, String studentEmail) {
        User student = findUserByEmail(studentEmail);
        QuizAttempt attempt = attemptRepository.findByUuidAndStudentId(UUID.fromString(attemptUuid), student.getId())
                .orElseThrow(() -> new BadRequestException("Attempt not found"));

        if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Attempt is still in progress");
        }

        List<AttemptAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        int correctCount = (int) answers.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
        int skippedCount = (int) answers.stream().filter(a -> Boolean.TRUE.equals(a.getIsSkipped())).count();
        int wrongCount = answers.size() - correctCount - skippedCount;

        return attemptMapper.toResultResponse(attempt, correctCount, wrongCount, skippedCount);
    }

    // ─── GET ATTEMPT REVIEW ─────────────────────────────

    @Transactional(readOnly = true)
    public AttemptReviewResponse getAttemptReview(String attemptUuid, String studentEmail) {
        User student = findUserByEmail(studentEmail);
        QuizAttempt attempt = attemptRepository.findByUuidAndStudentId(UUID.fromString(attemptUuid), student.getId())
                .orElseThrow(() -> new BadRequestException("Attempt not found"));

        if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Attempt is still in progress");
        }

        if (!Boolean.TRUE.equals(attempt.getQuiz().getShowCorrectAnswers())) {
            throw new BadRequestException("Review not available for this quiz");
        }

        List<AttemptAnswer> answers = answerRepository.findByAttemptId(attempt.getId());

        return attemptMapper.toReviewResponse(attempt, answers, this::parseJsonUuidList);
    }

    // ─── GET ATTEMPT HISTORY ────────────────────────────

    @Transactional(readOnly = true)
    public Page<AttemptHistoryResponse> getAttemptHistory(String studentEmail, Pageable pageable) {
        User student = findUserByEmail(studentEmail);
        return attemptRepository.findByStudentIdOrderByCreatedAtDesc(student.getId(), pageable)
                .map(attemptMapper::toHistoryResponse);
    }

    // ─── LOG AUDIT EVENT ────────────────────────────────

    @Transactional
    public void logAuditEvent(String attemptUuid, String studentEmail, AuditLogRequest request) {
        User student = findUserByEmail(studentEmail);
        QuizAttempt attempt = attemptRepository.findByUuidAndStudentId(UUID.fromString(attemptUuid), student.getId())
                .orElseThrow(() -> new BadRequestException("Attempt not found"));

        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Cannot log events for a completed attempt");
        }

        String eventDataJson = null;
        if (request.getEventData() != null) {
            try {
                eventDataJson = objectMapper.writeValueAsString(request.getEventData());
            } catch (Exception e) {
                log.warn("Failed to serialize audit event data: {}", e.getMessage());
            }
        }

        saveAuditLog(attempt, request.getEventType(), eventDataJson);

        if ("TAB_SWITCH".equals(request.getEventType())) {
            attempt.setTabSwitchCount(attempt.getTabSwitchCount() + 1);
        }
        if ("FULLSCREEN_EXIT".equals(request.getEventType())) {
            attempt.setFullscreenExitCount(attempt.getFullscreenExitCount() + 1);
        }

        int maxTabSwitches = platformSettingRepository.findById("max_tab_switches_allowed")
                .map(s -> Integer.parseInt(s.getValue()))
                .orElse(3);

        if (attempt.getTabSwitchCount() >= maxTabSwitches) {
            attempt.setIsFlaggedSuspicious(true);
        }

        attemptRepository.save(attempt);
    }

    // ═══════════════════════════════════════════════════════
    // SCORING (private — business logic stays in service)
    // ═══════════════════════════════════════════════════════

    private void scoreAttempt(QuizAttempt attempt) {
        List<AttemptAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        List<QuizQuestion> quizQuestions = quizQuestionRepository
                .findByQuizIdWithQuestionsAndOptions(attempt.getQuiz().getId());

        Map<Long, QuizQuestion> qqMap = quizQuestions.stream()
                .collect(Collectors.toMap(QuizQuestion::getId, qq -> qq));

        BigDecimal totalPositive = BigDecimal.ZERO;
        BigDecimal totalNegative = BigDecimal.ZERO;

        for (AttemptAnswer answer : answers) {
            if (Boolean.TRUE.equals(answer.getIsSkipped())) {
                answer.setIsCorrect(false);
                answer.setMarksAwarded(BigDecimal.ZERO);
                continue;
            }

            QuizQuestion qq = qqMap.get(answer.getQuizQuestion().getId());
            if (qq == null)
                continue;

            Question question = qq.getQuestion();
            boolean correct = evaluateAnswer(answer, question);
            answer.setIsCorrect(correct);

            BigDecimal marks;
            if (correct) {
                marks = qq.getMarks();
                if (Boolean.TRUE.equals(answer.getHintUsed()) && question.getHintMarkDeduction() != null) {
                    marks = marks.subtract(question.getHintMarkDeduction());
                    if (marks.compareTo(BigDecimal.ZERO) < 0)
                        marks = BigDecimal.ZERO;
                }
                totalPositive = totalPositive.add(marks);
            } else {
                marks = qq.getNegativeMarks().negate();
                totalNegative = totalNegative.add(qq.getNegativeMarks());
            }

            answer.setMarksAwarded(marks);
        }

        attempt.setPositiveMarks(totalPositive);
        attempt.setNegativeMarksDeducted(totalNegative);
        BigDecimal netMarks = totalPositive.subtract(totalNegative);
        if (netMarks.compareTo(BigDecimal.ZERO) < 0)
            netMarks = BigDecimal.ZERO;
        attempt.setMarksObtained(netMarks);

        if (attempt.getTotalMarksPossible().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal pct = netMarks.multiply(new BigDecimal("100"))
                    .divide(attempt.getTotalMarksPossible(), 2, RoundingMode.HALF_UP);
            attempt.setPercentage(pct);
            attempt.setIsPassed(netMarks.compareTo(attempt.getQuiz().getPassMarks()) >= 0);
        }
    }

    private boolean evaluateAnswer(AttemptAnswer answer, Question question) {
        QuestionType type = question.getQuestionType();
        return switch (type) {
            case MCQ_SINGLE -> evaluateSingleChoice(answer, question);
            case MCQ_MULTI -> evaluateMultipleChoice(answer, question);
            case TRUE_FALSE -> evaluateTrueFalse(answer, question);
            case SHORT_ANSWER, FILL_IN_THE_BLANK -> evaluateTextAnswer(answer, question);
            case ORDERING -> evaluateOrdering(answer, question);
            case MATCH_THE_FOLLOWING -> evaluateMatching(answer, question);
            case CODE_SNIPPET, IMAGE_BASED -> evaluateSingleChoice(answer, question);
            case ESSAY -> false;
        };
    }

    private boolean evaluateSingleChoice(AttemptAnswer answer, Question question) {
        List<UUID> ids = parseJsonUuidList(answer.getSelectedOptionIds());
        if (ids == null || ids.size() != 1)
            return false;
        UUID selectedUuid = ids.get(0);
        return question.getOptions().stream()
                .anyMatch(o -> selectedUuid.equals(o.getUuid()) && Boolean.TRUE.equals(o.getIsCorrect()));
    }

    private boolean evaluateMultipleChoice(AttemptAnswer answer, Question question) {
        List<UUID> ids = parseJsonUuidList(answer.getSelectedOptionIds());
        if (ids == null)
            return false;
        Set<UUID> selectedUuids = new HashSet<>(ids);
        Set<UUID> correctUuids = question.getOptions().stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .map(QuestionOption::getUuid)
                .collect(Collectors.toSet());
        return selectedUuids.equals(correctUuids);
    }

    private boolean evaluateTrueFalse(AttemptAnswer answer, Question question) {
        if (answer.getBooleanAnswer() == null)
            return false;
        Optional<QuestionOption> correctOption = question.getOptions().stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .findFirst();
        if (correctOption.isEmpty())
            return false;
        String correctText = correctOption.get().getOptionText().trim().toLowerCase();
        boolean expectedTrue = "true".equals(correctText) || "yes".equals(correctText);
        return answer.getBooleanAnswer() == expectedTrue;
    }

    private boolean evaluateTextAnswer(AttemptAnswer answer, Question question) {
        if (answer.getTextAnswer() == null || answer.getTextAnswer().isBlank())
            return false;
        String studentAnswer = answer.getTextAnswer().trim().toLowerCase();
        return question.getOptions().stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                .anyMatch(o -> studentAnswer.contains(o.getOptionText().trim().toLowerCase()));
    }

    private boolean evaluateOrdering(AttemptAnswer answer, Question question) {
        List<UUID> ids = parseJsonUuidList(answer.getOrderedOptionIds());
        if (ids == null)
            return false;
        List<UUID> correctOrder = question.getOptions().stream()
                .sorted(Comparator.comparingInt(QuestionOption::getOptionOrder))
                .map(QuestionOption::getUuid)
                .collect(Collectors.toList());
        return ids.equals(correctOrder);
    }

    private boolean evaluateMatching(AttemptAnswer answer, Question question) {
        Map<String, String> studentPairs = parseJsonStringMap(answer.getMatchPairs());
        if (studentPairs == null || studentPairs.isEmpty())
            return false;
        Map<String, String> correctPairs = new HashMap<>();
        for (QuestionOption opt : question.getOptions()) {
            if (opt.getMatchPairKey() != null && opt.getMatchPairVal() != null) {
                correctPairs.put(opt.getMatchPairKey(), opt.getMatchPairVal());
            }
        }
        if (studentPairs.size() != correctPairs.size())
            return false;
        for (Map.Entry<String, String> entry : correctPairs.entrySet()) {
            String studentVal = studentPairs.get(entry.getKey());
            if (studentVal == null || !studentVal.equals(entry.getValue()))
                return false;
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    private void calculateRank(QuizAttempt attempt) {
        // Provisional rank for this attempt; full re-rank for all attempts
        // (handles ties + bumps earlier attempts down) happens in
        // recomputeQuizRanks() after the enclosing transaction commits.
        int betterCount = attemptRepository.countBetterAttempts(
                attempt.getQuiz().getId(), attempt.getMarksObtained());
        attempt.setRank(betterCount + 1);
    }

    /**
     * Recompute ranks for all submitted attempts of a quiz using a window
     * function. Called in its own transaction after a submit/auto-submit
     * commits, so the new attempt is included.
     */
    @Transactional
    public void recomputeQuizRanks(Long quizId) {
        attemptRepository.recomputeRanksForQuiz(quizId);
    }

    private void createSkippedAnswers(QuizAttempt attempt) {
        List<Long> questionOrderIds = parseCommaSeparatedLongs(attempt.getQuestionOrder());
        if (questionOrderIds == null)
            return;

        for (Long qqId : questionOrderIds) {
            boolean exists = answerRepository.findByAttemptIdAndQuizQuestionId(attempt.getId(), qqId).isPresent();
            if (!exists) {
                QuizQuestion qq = quizQuestionRepository.findById(qqId).orElse(null);
                if (qq == null)
                    continue;

                AttemptAnswer skipped = AttemptAnswer.builder()
                        .attempt(attempt)
                        .quizQuestion(qq)
                        .question(qq.getQuestion())
                        .isSkipped(true)
                        .marksAwarded(BigDecimal.ZERO)
                        .build();
                answerRepository.save(skipped);
            }
        }
    }

    private void saveAuditLog(QuizAttempt attempt, String eventType, String eventData) {
        AttemptAuditLog auditLog = AttemptAuditLog.builder()
                .attempt(attempt)
                .eventType(eventType)
                .eventData(eventData)
                .occurredAt(Instant.now())
                .build();
        auditLogRepository.save(auditLog);
    }

    private List<QuizQuestion> selectQuestions(Quiz quiz, List<QuizQuestion> allQuestions) {
        List<QuizQuestion> pool = new ArrayList<>(allQuestions);
        if (Boolean.TRUE.equals(quiz.getShuffleQuestions())) {
            Collections.shuffle(pool);
        }
        if (quiz.getQuestionsToServe() != null && quiz.getQuestionsToServe() < pool.size()) {
            pool = pool.subList(0, quiz.getQuestionsToServe());
        }
        return pool;
    }

    // ─── Start response builder (resume case needs question reload) ──

    private StartAttemptResponse buildStartResponse(QuizAttempt attempt, Quiz quiz) {
        List<QuizQuestion> quizQuestions = quizQuestionRepository
                .findByQuizIdWithQuestionsAndOptions(quiz.getId());

        List<Long> servedIds = parseCommaSeparatedLongs(attempt.getQuestionOrder());
        if (servedIds == null) {
            servedIds = quizQuestions.stream().map(QuizQuestion::getId).collect(Collectors.toList());
        }

        Map<Long, QuizQuestion> qqMap = quizQuestions.stream()
                .collect(Collectors.toMap(QuizQuestion::getId, qq -> qq));

        List<QuizQuestion> served = servedIds.stream()
                .map(qqMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return attemptMapper.toStartResponse(attempt, quiz, served);
    }

    // ─── JSON / String helpers ──────────────────────────

    private String toJsonString(Object obj) {
        if (obj == null)
            return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }

    private List<Long> parseJsonLongList(String json) {
        if (json == null || json.isBlank())
            return null;
        try {
            if (json.startsWith("[")) {
                return objectMapper.readValue(json,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
            } else {
                return parseCommaSeparatedLongs(json);
            }
        } catch (Exception e) {
            return parseCommaSeparatedLongs(json);
        }
    }

    private List<UUID> parseJsonUuidList(String json) {
        if (json == null || json.isBlank())
            return null;
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, UUID.class));
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> parseJsonStringMap(String json) {
        if (json == null || json.isBlank())
            return null;
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, String.class));
        } catch (Exception e) {
            return null;
        }
    }

    private List<Long> parseCommaSeparatedLongs(String s) {
        if (s == null || s.isBlank())
            return null;

        List<Long> parsed = new ArrayList<>();
        for (String token : s.split(",")) {
            String trimmed = token.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                parsed.add(Long.parseLong(trimmed));
            } catch (NumberFormatException ex) {
                // Legacy/corrupt question_order values should not break attempt start/resume flow.
                log.warn("Skipping non-numeric question_order token: {}", trimmed);
            }
        }

        return parsed.isEmpty() ? null : parsed;
    }

    private UUID parseUuidOrThrow(String raw, String fieldName) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid " + fieldName + " format");
        }
    }
}
