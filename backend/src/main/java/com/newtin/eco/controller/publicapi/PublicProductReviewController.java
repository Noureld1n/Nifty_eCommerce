package com.newtin.eco.controller.publicapi;

import com.newtin.eco.dto.response.ProductReviewResponse;
import com.newtin.eco.dto.response.ProductReviewSummary;
import com.newtin.eco.service.ProductReviewService;
import com.newtin.eco.util.Pages;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/products/{productId}/reviews")
@RequiredArgsConstructor
public class PublicProductReviewController {
    private final ProductReviewService reviewService;

    @GetMapping
    public PagedModel<ProductReviewResponse> list(@PathVariable Long productId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(reviewService.listForProduct(productId, Pages.of(page, size)));
    }

    @GetMapping("/summary")
    public ProductReviewSummary summary(@PathVariable Long productId) {
        return reviewService.summary(productId);
    }
}
