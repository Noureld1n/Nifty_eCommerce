package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.request.ProductImageRequest;
import com.newtin.eco.dto.response.ProductImageResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.ProductImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products/{productId}/variants/{variantId}/images")
@RequiredArgsConstructor
public class AdminProductImageController {
    private final ProductImageService imageService;

    @GetMapping
    public List<ProductImageResponse> list(@PathVariable Long productId, @PathVariable Long variantId) {
        return imageService.list(productId, variantId);
    }

    @PostMapping
    public ResponseEntity<ProductImageResponse> create(@AuthenticationPrincipal CustomUserDetails admin,
                                                        @PathVariable Long productId,
                                                        @PathVariable Long variantId,
                                                        @Valid @RequestBody ProductImageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(imageService.create(admin.getId(), productId, variantId, request));
    }

    @PutMapping("/{imageId}")
    public ProductImageResponse update(@AuthenticationPrincipal CustomUserDetails admin,
                                      @PathVariable Long productId,
                                      @PathVariable Long variantId,
                                      @PathVariable Long imageId,
                                      @Valid @RequestBody ProductImageRequest request) {
        return imageService.update(admin.getId(), productId, variantId, imageId, request);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CustomUserDetails admin,
                                       @PathVariable Long productId,
                                       @PathVariable Long variantId,
                                       @PathVariable Long imageId) {
        imageService.delete(admin.getId(), productId, variantId, imageId);
        return ResponseEntity.noContent().build();
    }
}
