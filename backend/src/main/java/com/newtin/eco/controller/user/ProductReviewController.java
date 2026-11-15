package com.newtin.eco.controller.user;

import com.newtin.eco.dto.request.ProductReviewRequest;
import com.newtin.eco.dto.response.ProductReviewResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.ProductReviewService;
import com.newtin.eco.util.Pages;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class ProductReviewController {
    private final ProductReviewService reviewService;

    @GetMapping("/reviews")
    public PagedModel<ProductReviewResponse> listMine(@AuthenticationPrincipal CustomUserDetails principal,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(reviewService.listMine(principal.getId(), Pages.of(page, size)));
    }

    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<ProductReviewResponse> create(@AuthenticationPrincipal CustomUserDetails principal,
                                                        @PathVariable Long productId,
                                                        @Valid @RequestBody ProductReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(principal.getId(), productId, request));
    }

    @PutMapping("/reviews/{reviewId}")
    public ProductReviewResponse update(@AuthenticationPrincipal CustomUserDetails principal,
                                        @PathVariable Long reviewId,
                                        @Valid @RequestBody ProductReviewRequest request) {
        return reviewService.update(principal.getId(), reviewId, request);
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable Long reviewId) {
        reviewService.delete(principal.getId(), reviewId);
        return ResponseEntity.noContent().build();
    }
}
