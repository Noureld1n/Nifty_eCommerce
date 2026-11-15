package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "accessory_variant")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccessoryVariant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "accessory_variant_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, updatable = false)
    private Accessory accessory;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_item_id", nullable = false, updatable = false)
    private VariantItem variantItem;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean defaultVariant = false;

    @Column(length = 60)
    private String color;

    @Column(length = 120)
    private String material;

    @Builder.Default
    @Column(name = "price_adjustment", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;
}
