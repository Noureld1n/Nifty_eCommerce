package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clothing")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Clothing {
    @Id
    @Column(name = "product_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "clothing_type", nullable = false, length = 80)
    private String clothingType;

    @Column(length = 120)
    private String material;
}
