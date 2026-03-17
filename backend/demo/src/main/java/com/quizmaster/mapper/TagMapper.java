package com.quizmaster.mapper;

import com.quizmaster.dto.request.TagRequest;
import com.quizmaster.dto.response.TagResponse;
import com.quizmaster.entity.Tag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TagMapper {

    // ─── Entity → Response ──────────────────────────────

    TagResponse toResponse(Tag tag);

    // ─── Request → Entity (Create) ──────────────────────

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true) // auto-generated in @PrePersist
    @Mapping(target = "slug", ignore = true) // auto-generated in service
    @Mapping(target = "createdAt", ignore = true)
    Tag toEntity(TagRequest request);
}
