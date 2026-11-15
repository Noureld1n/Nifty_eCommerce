package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.request.CreateProductRequest;
import com.newtin.eco.dto.request.ProductRequest;
import com.newtin.eco.dto.request.UpdateStatusRequest;
import com.newtin.eco.dto.request.VariantRequest;
import com.newtin.eco.dto.request.VariantStatusRequest;
import com.newtin.eco.dto.response.ProductResponse;
import com.newtin.eco.dto.response.VariantResponse;
import com.newtin.eco.enums.ProductType;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.ProductService;
import com.newtin.eco.util.Pages;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {
    private final ProductService productService;

    @GetMapping
    public PagedModel<ProductResponse> list(@RequestParam(required = false) Long categoryId,
                                            @RequestParam(required = false) ProductType type,
                                            @RequestParam(required = false) Boolean active,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(productService.listAdmin(categoryId, type, active, Pages.of(page, size)));
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.getAdmin(id);
    }

    @PostMapping
    public ProductResponse create(@AuthenticationPrincipal CustomUserDetails admin,
                                  @Valid @RequestBody CreateProductRequest request) {
        return productService.create(admin.getId(), request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@AuthenticationPrincipal CustomUserDetails admin,
                                  @PathVariable Long id,
                                  @Valid @RequestBody ProductRequest request) {
        return productService.update(admin.getId(), id, request);
    }

    @PatchMapping("/{id}/status")
    public ProductResponse setStatus(@AuthenticationPrincipal CustomUserDetails admin,
                                     @PathVariable Long id,
                                     @Valid @RequestBody UpdateStatusRequest request) {
        return productService.setActive(admin.getId(), id, request.active());
    }

    @GetMapping("/{id}/variants")
    public List<VariantResponse> variants(@PathVariable Long id) {
        return productService.listVariants(id, false);
    }

    @PostMapping("/{id}/variants")
    public VariantResponse addVariant(@AuthenticationPrincipal CustomUserDetails admin,
                                      @PathVariable Long id,
                                      @Valid @RequestBody VariantRequest request) {
        return productService.addVariant(admin.getId(), id, request);
    }

    @PutMapping("/{id}/variants/{variantId}")
    public VariantResponse updateVariant(@AuthenticationPrincipal CustomUserDetails admin,
                                         @PathVariable Long id,
                                         @PathVariable Long variantId,
                                         @Valid @RequestBody VariantRequest request) {
        return productService.updateVariant(admin.getId(), id, variantId, request);
    }

    @PatchMapping("/{id}/variants/{variantId}/status")
    public VariantResponse setVariantStatus(@AuthenticationPrincipal CustomUserDetails admin,
                                            @PathVariable Long id,
                                            @PathVariable Long variantId,
                                            @Valid @RequestBody VariantStatusRequest request) {
        return productService.setVariantActive(admin.getId(), id, variantId, request.active());
    }

    @PutMapping("/{id}/variants/{variantId}/default")
    public VariantResponse setDefaultVariant(@AuthenticationPrincipal CustomUserDetails admin,
                                             @PathVariable Long id,
                                             @PathVariable Long variantId) {
        return productService.setDefaultVariant(admin.getId(), id, variantId);
    }
}
