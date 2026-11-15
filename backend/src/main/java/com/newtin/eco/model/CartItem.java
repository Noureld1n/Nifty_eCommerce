package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "cart_item")
@IdClass(CartItemId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem {
    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false, updatable = false)
    private ShoppingCart cart;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_item_id", nullable = false, updatable = false)
    private VariantItem variantItem;

    @Column(nullable = false)
    private Integer quantity;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;
}
