package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accessory")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Accessory {
    @Id
    @Column(name = "product_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "accessory_type", nullable = false, length = 80)
    private String accessoryType;

    @Column(length = 120)
    private String material;
}
