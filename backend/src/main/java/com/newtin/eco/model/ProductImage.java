package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_image")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_item_id", nullable = false, updatable = false)
    private VariantItem variantItem;

    @Column(name = "image_url", nullable = false, length = 2048)
    private String imageUrl;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Builder.Default
    @Column(name = "is_main", nullable = false)
    private boolean main = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
