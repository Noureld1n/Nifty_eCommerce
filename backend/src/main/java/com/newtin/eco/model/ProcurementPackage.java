package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "procurement_package")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProcurementPackage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false, updatable = false)
    private Provider provider;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "accountable_id", nullable = false, updatable = false)
    private Accountable accountable;

    @Column(name = "total_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "procurementPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcurementPackageItem> items = new ArrayList<>();
}
