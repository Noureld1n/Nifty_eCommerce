package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wish_list")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WishListItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wish_item_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, updatable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, updatable = false)
    private Product product;

    @CreationTimestamp
    @Column(name = "added_date", nullable = false, updatable = false)
    private LocalDateTime addedAt;
}
