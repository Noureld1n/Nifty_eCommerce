package com.newtin.eco.model;

import com.newtin.eco.enums.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipment")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Shipment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shipment_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Builder.Default
    @Column(name = "is_delivered", nullable = false)
    private boolean delivered = false;

    @Column(name = "tracking_number", length = 150)
    private String trackingNumber;

    @Column(length = 100)
    private String carrier;

    @Column(name = "expected_delivery_at")
    private LocalDateTime expectedDeliveryAt;

    @Column(name = "actual_delivery_at")
    private LocalDateTime actualDeliveryAt;

    @Builder.Default
    @Convert(converter = ShipmentStatusConverter.class)
    @Column(name = "shipment_status", nullable = false)
    private ShipmentStatus status = ShipmentStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
