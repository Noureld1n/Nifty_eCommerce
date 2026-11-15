package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "skincare")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Skincare {
    @Id
    @Column(name = "product_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "skincare_type", nullable = false, length = 80)
    private String skincareType;

    @Column(name = "skin_type", length = 100)
    private String skinType;
}
