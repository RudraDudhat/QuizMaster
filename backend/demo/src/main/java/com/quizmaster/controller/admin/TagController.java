package com.quizmaster.controller.admin;

import com.quizmaster.dto.request.TagRequest;
import com.quizmaster.dto.response.ApiResponse;
import com.quizmaster.dto.response.TagResponse;
import com.quizmaster.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/tags")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class TagController {

    private final TagService tagService;

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> createTag(
            @Valid @RequestBody TagRequest request) {
        TagResponse response = tagService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tag created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags() {
        List<TagResponse> tags = tagService.getAllTags();
        return ResponseEntity.ok(ApiResponse.success("Tags retrieved", tags));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TagResponse>>> searchTags(
            @RequestParam("q") String keyword) {
        List<TagResponse> tags = tagService.searchTags(keyword);
        return ResponseEntity.ok(ApiResponse.success("Tags found", tags));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable String uuid) {
        tagService.deleteTag(UUID.fromString(uuid));
        return ResponseEntity.ok(ApiResponse.success("Tag deleted successfully"));
    }
}
