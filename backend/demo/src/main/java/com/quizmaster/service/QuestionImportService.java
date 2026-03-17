package com.quizmaster.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.quizmaster.dto.request.CreateQuestionRequest;
import com.quizmaster.dto.request.OptionRequest;
import com.quizmaster.dto.response.BulkImportResponse;
import com.quizmaster.enums.DifficultyLevel;
import com.quizmaster.enums.QuestionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CSV Bulk Import Service for Questions.
 *
 * Expected CSV format (header row required):
 * question_text, question_type, difficulty, default_marks, negative_marks,
 * explanation,
 * option1_text, option1_correct, option2_text, option2_correct,
 * option3_text, option3_correct, option4_text, option4_correct
 *
 * Supported question_type values: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE,
 * SHORT_ANSWER, LONG_ANSWER, FILL_IN_THE_BLANK, NUMERICAL, CODE, MATCHING,
 * ORDERING
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionImportService {

    private final QuestionService questionService;

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

        // Parse options (columns 6+, pairs of option_text, is_correct)
        List<OptionRequest> options = new ArrayList<>();
        for (int i = 6; i + 1 < row.length; i += 2) {
            String optionText = row[i].trim();
            if (optionText.isEmpty())
                continue;

            boolean isCorrect = false;
            if (i + 1 < row.length) {
                String correctStr = row[i + 1].trim().toLowerCase();
                isCorrect = "true".equals(correctStr) || "1".equals(correctStr) || "yes".equals(correctStr);
            }

            options.add(OptionRequest.builder()
                    .optionText(optionText)
                    .optionOrder(options.size() + 1)
                    .isCorrect(isCorrect)
                    .build());
        }

        return CreateQuestionRequest.builder()
                .questionText(questionText)
                .questionType(questionType)
                .difficulty(difficulty)
                .defaultMarks(defaultMarks)
                .negativeMarks(negativeMarks)
                .explanation(explanation)
                .options(options.isEmpty() ? null : options)
                .build();
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
