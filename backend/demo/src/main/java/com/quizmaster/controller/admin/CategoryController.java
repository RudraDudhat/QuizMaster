package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.CreateCategoryRequest;
import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.CategoryResponse;
import com.quizmaster.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        CategoryResponse response = categoryService.createCategory(request, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved", categories));
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable String uuid) {
        CategoryResponse response = categoryService.getCategoryById(UUID.fromString(uuid));
        return ResponseEntity.ok(ApiResponse.success("Category retrieved", response));
    }

    @PutMapping("/{uuid}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable String uuid,
            @Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(UUID.fromString(uuid), request);
        return ResponseEntity.ok(ApiResponse.success("Category updated", response));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable String uuid) {
        categoryService.softDeleteCategory(UUID.fromString(uuid));
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully"));
    }

    private String extractEmail(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
