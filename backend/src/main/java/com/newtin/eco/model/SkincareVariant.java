package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "skincare_variant")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SkincareVariant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "skincare_variant_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, updatable = false)
    private Skincare skincare;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_item_id", nullable = false, updatable = false)
    private VariantItem variantItem;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean defaultVariant = false;

    @Column(name = "volume_ml", precision = 10, scale = 2)
    private BigDecimal volumeMl;

    @Column(name = "size_label", length = 40)
    private String sizeLabel;

    @Column(length = 120)
    private String formulation;

    @Builder.Default
    @Column(name = "price_adjustment", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;
}
