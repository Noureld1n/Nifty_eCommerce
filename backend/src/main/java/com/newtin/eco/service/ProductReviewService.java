package com.newtin.eco.service;

import com.newtin.eco.dto.request.ProductReviewRequest;
import com.newtin.eco.dto.response.ProductReviewResponse;
import com.newtin.eco.dto.response.ProductReviewSummary;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.ProductReview;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.ProductRepository;
import com.newtin.eco.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ProductReviewService {
    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public Page<ProductReviewResponse> listForProduct(Long productId, Pageable pageable) {
        ensurePublicProduct(productId);
        return reviewRepository.findForProduct(productId, pageable).map(ProductReviewResponse::from);
    }

    @Transactional(readOnly = true)
    public ProductReviewSummary summary(Long productId) {
        ensurePublicProduct(productId);
        Double average = reviewRepository.averageRating(productId);
        return new ProductReviewSummary(reviewRepository.countByProductId(productId),
                average == null ? BigDecimal.ZERO.setScale(2)
                        : BigDecimal.valueOf(average).setScale(2, java.math.RoundingMode.HALF_UP));
    }

    @Transactional(readOnly = true)
    public Page<ProductReviewResponse> listMine(Long customerId, Pageable pageable) {
        return reviewRepository.findMine(customerId, pageable).map(ProductReviewResponse::from);
    }

    @Transactional
    public ProductReviewResponse create(Long customerId, Long productId, ProductReviewRequest request) {
        if (request.rating() == null) throw new BadRequestException("Review rating is required");
        var product = ensurePublicProduct(productId);
        if (reviewRepository.existsByCustomerIdAndProductId(customerId, productId))
            throw new ConflictException("You have already reviewed this product");
        ProductReview review = ProductReview.builder()
                .customer(customerRepository.getReferenceById(customerId))
                .product(product)
                .title(trimToNull(request.title()))
                .text(trimToNull(request.text()))
                .rating(request.rating())
                .recommended(request.recommended())
                .build();
        return ProductReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional
    public ProductReviewResponse update(Long customerId, Long reviewId, ProductReviewRequest request) {
        if (request.rating() == null) throw new BadRequestException("Review rating is required");
        ProductReview review = findMine(customerId, reviewId);
        review.setTitle(trimToNull(request.title()));
        review.setText(trimToNull(request.text()));
        review.setRating(request.rating());
        review.setRecommended(request.recommended());
        return ProductReviewResponse.from(review);
    }

    @Transactional
    public void delete(Long customerId, Long reviewId) {
        reviewRepository.delete(findMine(customerId, reviewId));
    }

    private ProductReview findMine(Long customerId, Long reviewId) {
        return reviewRepository.findByIdAndCustomerId(reviewId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
    }

    private com.newtin.eco.model.Product ensurePublicProduct(Long productId) {
        return productRepository.findByIdAndActiveTrue(productId)
                .filter(product -> product.getCategory() == null || product.getCategory().isActive())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
