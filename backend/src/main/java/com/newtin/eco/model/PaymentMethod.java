package com.newtin.eco.model;

import com.newtin.eco.enums.CardBrand;
import com.newtin.eco.enums.PaymentProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "payment_method")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentMethod {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_method_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, updatable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentProvider provider;

    @Column(name = "provider_token", nullable = false)
    private String providerToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "card_brand")
    private CardBrand cardBrand;

    @Column(length = 4)
    private String last4;

    @Column(name = "expiry_month")
    private Integer expiryMonth;

    @Column(name = "expiry_year")
    private Integer expiryYear;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean defaultMethod = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    // default_customer_id (generated column) is intentionally unmapped; the DB maintains it

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}