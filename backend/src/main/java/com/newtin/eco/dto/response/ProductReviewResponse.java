package com.newtin.eco.dto.response;

import com.newtin.eco.model.ProductReview;

import java.time.LocalDateTime;

public record ProductReviewResponse(
        Long id,
        Long productId,
        String customerName,
        String title,
        String text,
        Integer rating,
        Boolean recommended,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ProductReviewResponse from(ProductReview review) {
        var user = review.getCustomer().getUser();
        String lastInitial = user.getLastName() == null || user.getLastName().isBlank()
                ? "" : " " + user.getLastName().charAt(0) + ".";
        return new ProductReviewResponse(review.getId(), review.getProduct().getId(),
                user.getFirstName() + lastInitial, review.getTitle(), review.getText(),
                review.getRating(), review.getRecommended(), review.getCreatedAt(), review.getUpdatedAt());
    }
}
