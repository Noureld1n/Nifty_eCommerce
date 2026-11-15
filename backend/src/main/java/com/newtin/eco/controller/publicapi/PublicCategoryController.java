package com.newtin.eco.controller.publicapi;

import com.newtin.eco.dto.response.CategoryResponse;
import com.newtin.eco.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/categories")
@RequiredArgsConstructor
public class PublicCategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> list() {
        return categoryService.listPublic();
    }
}
