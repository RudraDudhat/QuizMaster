package com.quizmaster.mapper;

import com.quizmaster.dto.request.CreateQuestionRequest;
import com.quizmaster.dto.request.OptionRequest;
import com.quizmaster.dto.request.UpdateQuestionRequest;
import com.quizmaster.dto.response.QuestionResponse;
import com.quizmaster.entity.Question;
import com.quizmaster.entity.QuestionOption;
import com.quizmaster.entity.Tag;
import org.mapstruct.*;

import java.util.*;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface QuestionMapper {

    // ─── Entity → Response ──────────────────────────────

    @Mapping(source = "createdBy.uuid",     target = "createdByUuid")
    @Mapping(source = "createdBy.fullName", target = "createdByName")
    @Mapping(source = "options", target = "options", qualifiedByName = "optionsToResponse")
    @Mapping(source = "tags", target = "tags", qualifiedByName = "tagsToNames")
    QuestionResponse toResponse(Question question);

    // ─── Request → Entity (Create) ──────────────────────

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "options", ignore = true)
    @Mapping(target = "isArchived", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Question toEntity(CreateQuestionRequest request);

    // ─── Request → Entity (Update, null = skip) ─────────

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "options", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntityFromRequest(UpdateQuestionRequest request, @MappingTarget Question question);

    // ─── Option Entity → DTO ────────────────────────────

    QuestionResponse.OptionResponse optionToResponse(QuestionOption option);

    // ─── Custom Mapping Helpers ─────────────────────────

    @Named("optionsToResponse")
    default List<QuestionResponse.OptionResponse> optionsToResponse(Set<QuestionOption> options) {
        if (options == null)
            return Collections.emptyList();
        return options.stream()
                .sorted(Comparator.comparingInt(QuestionOption::getOptionOrder))
                .map(this::optionToResponse)
                .collect(Collectors.toList());
    }

    @Named("tagsToNames")
    default Set<String> tagsToNames(Set<Tag> tags) {
        if (tags == null)
            return Collections.emptySet();
        return tags.stream().map(Tag::getName).collect(Collectors.toSet());
    }
}
