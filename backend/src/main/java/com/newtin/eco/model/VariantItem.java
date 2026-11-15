package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "variant_item")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VariantItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variant_item_id")
    private Long id;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(name = "additional_description", length = 1000)
    private String additionalDescription;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
