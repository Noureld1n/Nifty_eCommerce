package com.newtin.eco.model;

import com.newtin.eco.enums.ProductType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false)
    private ProductType type;

    @Column(name = "product_name", nullable = false, length = 200)
    private String name;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "creation_date", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "pro_description", length = 1000)
    private String description;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private Clothing clothing;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private Accessory accessory;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private Skincare skincare;
}
