package com.quizmaster.mapper;

import com.quizmaster.dto.request.CreateQuizRequest;
import com.quizmaster.dto.request.UpdateQuizRequest;
import com.quizmaster.dto.response.QuizResponse;
import com.quizmaster.entity.Quiz;
import com.quizmaster.entity.Tag;
import org.mapstruct.*;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface QuizMapper {

    // ─── Entity → Response ──────────────────────────────

    @Mapping(source = "category.uuid", target = "categoryUuid")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "createdBy.uuid", target = "createdByUuid")
    @Mapping(source = "createdBy.fullName", target = "createdByName")
    @Mapping(source = "tags", target = "tags", qualifiedByName = "tagsToNames")
    QuizResponse toResponse(Quiz quiz);

    // ─── Request → Entity (Create) ──────────────────────

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true)
    @Mapping(target = "category", ignore = true) // resolved in service
    @Mapping(target = "createdBy", ignore = true) // set in service
    @Mapping(target = "status", ignore = true) // defaults to DRAFT
    @Mapping(target = "tags", ignore = true) // resolved in service
    @Mapping(target = "allowedIpRange", ignore = true) // not exposed in request
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    Quiz toEntity(CreateQuizRequest request);

    // ─── Request → Entity (Update, null = skip) ─────────

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "allowedIpRange", ignore = true) // not exposed in request
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    void updateEntityFromRequest(UpdateQuizRequest request, @MappingTarget Quiz quiz);

    // ─── Custom Mapping Helpers ─────────────────────────

    @Named("tagsToNames")
    default Set<String> tagsToNames(Set<Tag> tags) {
        if (tags == null)
            return Collections.emptySet();
        return tags.stream().map(Tag::getName).collect(Collectors.toSet());
    }
}
