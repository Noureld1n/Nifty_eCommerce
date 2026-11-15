package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.request.CategoryRequest;
import com.newtin.eco.dto.request.UpdateStatusRequest;
import com.newtin.eco.dto.response.CategoryResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> list() {
        return categoryService.listAdmin();
    }

    @PostMapping
    public CategoryResponse create(@AuthenticationPrincipal CustomUserDetails admin,
                                   @Valid @RequestBody CategoryRequest request) {
        return categoryService.create(admin.getId(), request);
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@AuthenticationPrincipal CustomUserDetails admin,
                                   @PathVariable Long id,
                                   @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(admin.getId(), id, request);
    }

    @PatchMapping("/{id}/status")
    public CategoryResponse setStatus(@AuthenticationPrincipal CustomUserDetails admin,
                                      @PathVariable Long id,
                                      @Valid @RequestBody UpdateStatusRequest request) {
        return categoryService.setActive(admin.getId(), id, request.active());
    }
}
