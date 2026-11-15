package com.newtin.eco.service;

import com.newtin.eco.dto.request.CategoryRequest;
import com.newtin.eco.dto.response.CategoryResponse;
import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.Category;
import com.newtin.eco.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository repository;
    private final AdminActionLogService actionLogService;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listPublic() {
        return repository.findByActiveTrueOrderByNameAsc().stream().map(CategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAdmin() {
        return repository.findAll().stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse create(Long adminId, CategoryRequest request) {
        Category parent = request.parentCategoryId() == null ? null : find(request.parentCategoryId());
        if (parent != null && !parent.isActive())
            throw new ConflictException("Cannot create a category under an inactive parent");
        String name = request.name().trim();
        if (repository.existsByNameAndParentId(name, request.parentCategoryId()))
            throw new ConflictException("Category name already exists under this parent");

        Category category = repository.save(Category.builder().name(name).parent(parent).build());
        actionLogService.log(adminId, AdminActionType.CATEGORY_CREATED, AuditEntityType.CATEGORY,
                category.getId(), "Category created", null, Map.of("name", name));
        return CategoryResponse.from(category);
    }

    @Transactional
    public CategoryResponse update(Long adminId, Long id, CategoryRequest request) {
        Category category = find(id);
        Category parent = request.parentCategoryId() == null ? null : find(request.parentCategoryId());
        for (Category ancestor = parent; ancestor != null; ancestor = ancestor.getParent()) {
            if (ancestor.getId().equals(id))
                throw new BadRequestException("A category cannot be moved under itself or its descendants");
        }
        if (parent != null && !parent.isActive())
            throw new ConflictException("Cannot move a category under an inactive parent");
        String name = request.name().trim();
        if (repository.existsByNameAndParentId(name, request.parentCategoryId())
                && !(category.getName().equals(name)
                && (category.getParent() == null ? request.parentCategoryId() == null
                : category.getParent().getId().equals(request.parentCategoryId()))))
            throw new ConflictException("Category name already exists under this parent");

        category.setName(name);
        category.setParent(parent);
        actionLogService.log(adminId, AdminActionType.CATEGORY_UPDATED, AuditEntityType.CATEGORY,
                id, "Category updated", null, Map.of("name", name));
        return CategoryResponse.from(category);
    }

    @Transactional
    public CategoryResponse setActive(Long adminId, Long id, boolean active) {
        Category category = find(id);
        if (!active && !category.isActive()) return CategoryResponse.from(category);
        if (active && category.getParent() != null && !category.getParent().isActive())
            throw new ConflictException("Activate the parent category first");
        if (!active && repository.existsByParentIdAndActiveTrue(id))
            throw new ConflictException("Deactivate child categories before this category");
        category.setActive(active);
        actionLogService.log(adminId,
                active ? AdminActionType.CATEGORY_ACTIVATED : AdminActionType.CATEGORY_DEACTIVATED,
                AuditEntityType.CATEGORY, id, active ? "Category activated" : "Category deactivated",
                null, Map.of("active", active));
        return CategoryResponse.from(category);
    }

    private Category find(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }
}
