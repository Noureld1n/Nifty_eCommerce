package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_review")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, updatable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, updatable = false)
    private Product product;

    @Column(length = 200)
    private String title;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private Integer rating;

    private Boolean recommended;

    @CreationTimestamp
    @Column(name = "review_date", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
