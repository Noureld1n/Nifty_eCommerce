package com.newtin.eco.controller.publicapi;

import com.newtin.eco.dto.response.ProductResponse;
import com.newtin.eco.enums.ProductType;
import com.newtin.eco.service.ProductService;
import com.newtin.eco.util.Pages;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/products")
@RequiredArgsConstructor
public class PublicProductController {
    private final ProductService productService;

    @GetMapping
    public PagedModel<ProductResponse> list(@RequestParam(required = false) Long categoryId,
                                            @RequestParam(required = false) ProductType type,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(productService.listPublic(categoryId, type, Pages.of(page, size)));
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.getPublic(id);
    }
}
