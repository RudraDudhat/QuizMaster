package com.quizmaster.service;

import com.quizmaster.dto.request.TagRequest;
import com.quizmaster.dto.response.TagResponse;
import com.quizmaster.entity.Tag;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.mapper.TagMapper;
import com.quizmaster.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    // ─── CREATE ─────────────────────────────────────────

    @Transactional
    public TagResponse createTag(TagRequest request) {
        Tag tag = tagMapper.toEntity(request);
        String baseSlug = generateSlug(request.getName());
        String finalSlug = baseSlug;
        int counter = 1;

        while (tagRepository.existsBySlug(finalSlug)) {
            finalSlug = baseSlug + "-" + counter;
            counter++;
        }

        tag.setSlug(finalSlug);
        tag = tagRepository.save(tag);
        return tagMapper.toResponse(tag);
    }

    // ─── READ ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TagResponse> getAllTags() {
        return tagRepository.findAll()
                .stream()
                .map(tagMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TagResponse> searchTags(String keyword) {
        return tagRepository.findByNameContainingIgnoreCase(keyword)
                .stream()
                .map(tagMapper::toResponse)
                .collect(Collectors.toList());
    }

    // ─── DELETE ─────────────────────────────────────────

    @Transactional
    public void deleteTag(UUID uuid) {
        Tag tag = tagRepository.findByUuid(uuid)
                .orElseThrow(() -> new BadRequestException("Tag not found"));
        tagRepository.delete(tag);
    }

    // ─── HELPERS ────────────────────────────────────────

    private String generateSlug(String name) {
        return name.trim()
                .toLowerCase()
                .replaceAll("\\+\\+", "-plus-plus")   // c++ → c-plus-plus
                .replaceAll("\\+", "-plus")           // c+  → c-plus
                .replaceAll("#", "-sharp")            // c#  → c-sharp
                .replaceAll("\\.", "-dot-")           // node.js → node-dot-js
                .replaceAll("[^a-z0-9\\s-]", "")      // remove remaining specials
                .replaceAll("\\s+", "-")              // spaces → hyphens
                .replaceAll("-{2,}", "-")             // collapse multiple hyphens
                .replaceAll("^-|-$", "");             // trim leading/trailing hyphens
    }
}
