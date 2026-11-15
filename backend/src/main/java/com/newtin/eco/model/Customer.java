package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "customer")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer {
    @Id @Column(name = "customer_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @MapsId
    @JoinColumn(name = "customer_id")
    private User user;

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal points = BigDecimal.ZERO;
}
