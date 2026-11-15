package com.newtin.eco.model;

import com.newtin.eco.enums.OrderStatus;
import com.newtin.eco.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sys_order")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, updatable = false)
    private Customer customer;

    @Builder.Default
    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "creation_date", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Convert(converter = OrderStatusConverter.class)
    @Column(name = "order_status", nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Builder.Default
    @Convert(converter = PaymentStatusConverter.class)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_address_id")
    private Address shippingAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_address_id")
    private Address billingAddress;

    @Builder.Default
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode = "EGP";

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", fetch = FetchType.LAZY)
    private Shipment shipment;
}
