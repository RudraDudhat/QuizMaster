package com.quizmaster.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.quizmaster.dto.request.CreateQuestionRequest;
import com.quizmaster.dto.request.OptionRequest;
import com.quizmaster.dto.response.BulkImportResponse;
import com.quizmaster.entity.Tag;
import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
import com.quizmaster.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * CSV Bulk Import Service for Questions.
 *
 * Expected CSV format (header row required):
 * questionText, questionType, difficulty, marks, negativeMarks,
 * explanation, option1, option2, option3, option4, correctOption,
 * codeSnippet(optional), codeLanguage(optional), tags(optional)
 *
 * Supported question_type values: MCQ_SINGLE, MCQ_MULTI, TRUE_FALSE,
 * SHORT_ANSWER, ESSAY, FILL_IN_THE_BLANK, CODE_SNIPPET, MATCH_THE_FOLLOWING,
 * ORDERING
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionImportService {

    private final QuestionService questionService;
    private final TagRepository tagRepository;

    public BulkImportResponse importFromCsv(MultipartFile file, String adminEmail) {
        List<BulkImportResponse.RowError> errors = new ArrayList<>();
        int totalRows = 0;
        int successCount = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()));
                CSVReader reader = new CSVReader(br)) {

            // Skip header
            String[] header = reader.readNext();
            if (header == null) {
                errors.add(BulkImportResponse.RowError.builder()
                        .row(0).message("CSV file is empty").build());
                return buildResponse(0, 0, errors);
            }

            String[] row;
            int rowNum = 1;

            while ((row = reader.readNext()) != null) {
                totalRows++;
                rowNum++;

                try {
                    CreateQuestionRequest request = parseRow(row, rowNum);
                    questionService.createQuestion(request, adminEmail);
                    successCount++;
                } catch (Exception e) {
                    errors.add(BulkImportResponse.RowError.builder()
                            .row(rowNum).message(e.getMessage()).build());
                }
            }

        } catch (CsvValidationException e) {
            errors.add(BulkImportResponse.RowError.builder()
                    .row(0).message("CSV validation error: " + e.getMessage()).build());
        } catch (Exception e) {
            errors.add(BulkImportResponse.RowError.builder()
                    .row(0).message("Failed to read CSV: " + e.getMessage()).build());
        }

        return buildResponse(totalRows, successCount, errors);
    }

    private CreateQuestionRequest parseRow(String[] row, int rowNum) {
        if (row.length < 6) {
            throw new IllegalArgumentException("Row " + rowNum + ": minimum 6 columns required");
        }

        String questionText = row[0].trim();
        if (questionText.isEmpty()) {
            throw new IllegalArgumentException("Row " + rowNum + ": question_text is required");
        }

        QuestionType questionType;
        try {
            questionType = QuestionType.valueOf(row[1].trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Row " + rowNum + ": invalid question_type '" + row[1].trim() + "'");
        }

        DifficultyLevel difficulty = DifficultyLevel.MEDIUM;
        if (row.length > 2 && !row[2].trim().isEmpty()) {
            try {
                difficulty = DifficultyLevel.valueOf(row[2].trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Row " + rowNum + ": invalid difficulty '" + row[2].trim() + "'");
            }
        }

        BigDecimal defaultMarks = BigDecimal.ONE;
        if (row.length > 3 && !row[3].trim().isEmpty()) {
            defaultMarks = new BigDecimal(row[3].trim());
        }

        BigDecimal negativeMarks = BigDecimal.ZERO;
        if (row.length > 4 && !row[4].trim().isEmpty()) {
            negativeMarks = new BigDecimal(row[4].trim());
        }

        String explanation = row.length > 5 ? row[5].trim() : null;
        String codeSnippet = safeCell(row, 11);
        String codeLanguage = safeCell(row, 12);
        Set<UUID> tagUuids = resolveTagUuidsByName(safeCell(row, 13), rowNum);

        // Parse template options: option1..option4 + correctOption
        List<OptionRequest> options = parseTemplateOptions(row, rowNum, questionType);

        return CreateQuestionRequest.builder()
                .questionText(questionText)
                .questionType(questionType)
                .difficulty(difficulty)
                .defaultMarks(defaultMarks)
                .negativeMarks(negativeMarks)
                .explanation(explanation)
                .mediaUrl(questionType == QuestionType.CODE_SNIPPET ? codeSnippet : null)
                .codeLanguage(questionType == QuestionType.CODE_SNIPPET ? codeLanguage : null)
                .tagUuids(tagUuids.isEmpty() ? null : tagUuids)
                .options(options.isEmpty() ? null : options)
                .build();
    }

    private String safeCell(String[] row, int index) {
        if (row.length <= index || row[index] == null)
            return null;
        String value = row[index].trim();
        return value.isEmpty() ? null : value;
    }

    private Set<UUID> resolveTagUuidsByName(String raw, int rowNum) {
        Set<UUID> uuids = new HashSet<>();
        if (raw == null || raw.isBlank()) {
            return uuids;
        }

        String[] tokens = raw.split("[|,;]");
        for (String token : tokens) {
            String tagName = token.trim();
            if (tagName.isEmpty()) {
                continue;
            }
            if (tagName.length() > 80) {
                throw new IllegalArgumentException("Row " + rowNum + ": tag name exceeds 80 characters: '" + tagName + "'");
            }

            Tag tag = tagRepository.findByNameIgnoreCase(tagName)
                    .orElseGet(() -> createTag(tagName));
            uuids.add(tag.getUuid());
        }

        return uuids;
    }

    private Tag createTag(String tagName) {
        Tag tag = Tag.builder()
                .name(tagName)
                .slug(generateSlug(tagName))
                .build();
        return tagRepository.save(tag);
    }

    private String generateSlug(String name) {
        return name.trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
    }

    private List<OptionRequest> parseTemplateOptions(String[] row, int rowNum, QuestionType questionType) {
        List<String> optionTexts = new ArrayList<>();

        // Columns: 6=option1, 7=option2, 8=option3, 9=option4
        for (int i = 6; i <= 9; i++) {
            if (row.length <= i)
                break;
            String optionText = row[i] != null ? row[i].trim() : "";
            if (!optionText.isEmpty()) {
                optionTexts.add(optionText);
            }
        }

        if (optionTexts.isEmpty()) {
            return new ArrayList<>();
        }

        String correctOptionRaw = row.length > 10 && row[10] != null ? row[10].trim() : "";
        Set<Integer> correctIndexes = resolveCorrectIndexes(correctOptionRaw, optionTexts, questionType, rowNum);

        if (isChoiceBasedQuestion(questionType) && !optionTexts.isEmpty() && correctIndexes.isEmpty()) {
            throw new IllegalArgumentException(
                "Row " + rowNum + ": correctOption is required for " + questionType);
        }

        if ((questionType == QuestionType.TRUE_FALSE || questionType == QuestionType.MCQ_SINGLE)
            && correctIndexes.size() > 1) {
            throw new IllegalArgumentException(
                "Row " + rowNum + ": " + questionType + " supports only one correct option");
        }

        List<OptionRequest> options = new ArrayList<>();
        for (int i = 0; i < optionTexts.size(); i++) {
            options.add(OptionRequest.builder()
                    .optionText(optionTexts.get(i))
                    .optionOrder(i + 1)
                    .isCorrect(correctIndexes.contains(i + 1))
                    .build());
        }

        return options;
    }

    private boolean isChoiceBasedQuestion(QuestionType questionType) {
        return questionType == QuestionType.MCQ_SINGLE
                || questionType == QuestionType.MCQ_MULTI
                || questionType == QuestionType.TRUE_FALSE
                || questionType == QuestionType.IMAGE_BASED
                || questionType == QuestionType.CODE_SNIPPET
                || questionType == QuestionType.ORDERING
                || questionType == QuestionType.MATCH_THE_FOLLOWING;
    }

    private Set<Integer> resolveCorrectIndexes(String correctOptionRaw, List<String> optionTexts,
            QuestionType questionType, int rowNum) {
        Set<Integer> indexes = new HashSet<>();
        if (correctOptionRaw == null || correctOptionRaw.isBlank()) {
            return indexes;
        }

        String[] tokens = correctOptionRaw.split("[|,;/]");
        for (String token : tokens) {
            String value = token.trim();
            if (value.isEmpty()) {
                continue;
            }

            try {
                int idx = Integer.parseInt(value);
                if (idx >= 1 && idx <= optionTexts.size()) {
                    indexes.add(idx);
                    continue;
                }
                throw new IllegalArgumentException(
                        "Row " + rowNum + ": correctOption index out of range: " + idx);
            } catch (NumberFormatException ignored) {
                // Non-numeric values are supported (e.g. TRUE/FALSE or exact option text)
            }

            boolean matched = false;
            for (int i = 0; i < optionTexts.size(); i++) {
                if (optionTexts.get(i).equalsIgnoreCase(value)) {
                    indexes.add(i + 1);
                    matched = true;
                    break;
                }
            }

            if (!matched && questionType == QuestionType.TRUE_FALSE) {
                for (int i = 0; i < optionTexts.size(); i++) {
                    String normalized = optionTexts.get(i).trim().toLowerCase();
                    if (("true".equals(value.toLowerCase()) && "true".equals(normalized))
                            || ("false".equals(value.toLowerCase()) && "false".equals(normalized))) {
                        indexes.add(i + 1);
                        matched = true;
                        break;
                    }
                }
            }

            if (!matched) {
                throw new IllegalArgumentException(
                        "Row " + rowNum + ": invalid correctOption value '" + value + "'");
            }
        }

        return indexes;
    }

    private BulkImportResponse buildResponse(int total, int success, List<BulkImportResponse.RowError> errors) {
        return BulkImportResponse.builder()
                .totalRows(total)
                .successCount(success)
                .failureCount(total - success)
                .errors(errors)
                .build();
    }
}
