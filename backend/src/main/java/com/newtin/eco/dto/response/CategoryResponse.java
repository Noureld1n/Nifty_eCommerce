package com.newtin.eco.dto.response;

import com.newtin.eco.model.Category;

import java.time.LocalDateTime;

public record CategoryResponse(Long id, String name, Long parentCategoryId, boolean active,
                               LocalDateTime createdAt) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(),
                category.getParent() == null ? null : category.getParent().getId(),
                category.isActive(), category.getCreatedAt());
    }
}
