package com.newtin.eco.model;

import com.newtin.eco.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "promotion")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Promotion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_id")
    private Long id;

    @Column(name = "promo_name", nullable = false, length = 150)
    private String name;

    @Column(name = "promo_description", columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @ManyToMany
    @JoinTable(name = "promotion_category",
            joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    @Builder.Default
    @ManyToMany
    @JoinTable(name = "promotion_product",
            joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id"))
    private Set<Product> products = new HashSet<>();
}
