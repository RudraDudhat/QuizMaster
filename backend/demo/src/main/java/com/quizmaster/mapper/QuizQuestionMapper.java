package com.quizmaster.mapper;

import com.quizmaster.dto.response.QuizQuestionResponse;
import com.quizmaster.entity.QuizQuestion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface QuizQuestionMapper {

    @Mapping(source = "uuid",                     target = "uuid")
    @Mapping(source = "quiz.uuid",                target = "quizUuid")
    @Mapping(source = "question.uuid",            target = "questionUuid")
    @Mapping(source = "question.questionText",    target = "questionText")
    @Mapping(source = "question.questionType",    target = "questionType")
    @Mapping(source = "question.difficulty",      target = "difficulty")
    QuizQuestionResponse toResponse(QuizQuestion quizQuestion);
}
