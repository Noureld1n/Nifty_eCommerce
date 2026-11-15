package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Formula;

import java.math.BigDecimal;

@Entity
@Table(name = "procurement_package_item")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProcurementPackageItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_item_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false, updatable = false)
    private ProcurementPackage procurementPackage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_item_id", nullable = false, updatable = false)
    private VariantItem variantItem;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Formula("quantity * unit_cost")
    private BigDecimal lineTotal;

    @Column(length = 500)
    private String notes;
}
