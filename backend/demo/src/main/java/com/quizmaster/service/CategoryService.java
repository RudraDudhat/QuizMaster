package com.quizmaster.service;

import com.quizmaster.dto.request.CreateCategoryRequest;
import com.quizmaster.dto.response.CategoryResponse;
import com.quizmaster.entity.Category;
import com.quizmaster.entity.User;
import com.quizmaster.exception.BadRequestException;
import com.quizmaster.mapper.CategoryMapper;
import com.quizmaster.repository.CategoryRepository;
import com.quizmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CategoryMapper categoryMapper;

    // ─── CREATE ─────────────────────────────────────────

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Category parent = resolveParent(request.getParentUuid());

        Category category = categoryMapper.toEntity(request);
        category.setCreatedBy(admin);
        category.setParent(parent);

        category = categoryRepository.save(category);
        return categoryMapper.toResponse(category);
    }

    // ─── READ ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findByDeletedAtIsNull()
                .stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID uuid) {
        Category category = categoryRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Category not found"));
        return categoryMapper.toResponse(category);
    }

    // ─── UPDATE ─────────────────────────────────────────

    @Transactional
    public CategoryResponse updateCategory(UUID uuid, CreateCategoryRequest request) {
        Category category = categoryRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Category not found"));
        return doUpdateCategory(category, request);
    }

    private CategoryResponse doUpdateCategory(Category category, CreateCategoryRequest request) {
        categoryMapper.updateEntityFromRequest(request, category);

        // Resolve parent FK if provided
        if (request.getParentUuid() != null) {
            category.setParent(resolveParent(request.getParentUuid()));
        }

        category = categoryRepository.save(category);
        return categoryMapper.toResponse(category);
    }

    // ─── SOFT DELETE ────────────────────────────────────

    @Transactional
    public void softDeleteCategory(UUID uuid) {
        Category category = categoryRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new BadRequestException("Category not found"));
        category.setDeletedAt(Instant.now());
        categoryRepository.save(category);
    }

    // ─── HELPERS ────────────────────────────────────────

    private Category resolveParent(UUID parentUuid) {
        if (parentUuid == null)
            return null;
        return categoryRepository.findByUuidAndDeletedAtIsNull(parentUuid)
                .orElseThrow(() -> new BadRequestException("Parent category not found"));
    }
}
