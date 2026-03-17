package com.quizmaster.mapper;

import com.quizmaster.dto.request.CreateCategoryRequest;
import com.quizmaster.dto.response.CategoryResponse;
import com.quizmaster.entity.Category;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    // ─── Entity → Response ──────────────────────────────

    @Mapping(source = "parent.uuid",     target = "parentUuid")
    @Mapping(source = "parent.name",     target = "parentName")
    @Mapping(source = "createdBy.uuid",  target = "createdByUuid")
    CategoryResponse toResponse(Category category);

    // ─── Request → Entity (Create) ──────────────────────

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true) // auto-generated in @PrePersist
    @Mapping(target = "parent", ignore = true)       // resolved in service
    @Mapping(target = "createdBy", ignore = true)     // set in service
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Category toEntity(CreateCategoryRequest request);

    // ─── Request → Entity (Update, null = skip) ─────────

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntityFromRequest(CreateCategoryRequest request, @MappingTarget Category category);
}
