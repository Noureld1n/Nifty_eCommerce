package com.newtin.eco.model;

import com.newtin.eco.enums.AddressType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "address")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Address {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, updatable = false)
    private Customer customer;

    @Column(nullable = false)
    private String street;

    @Column(nullable = false)
    private String city;

    private String state;
    private String zipcode;

    @Builder.Default
    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode = "EG";

    @Enumerated(EnumType.STRING)
    @Column(name = "address_type", nullable = false)
    private AddressType addressType;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean defaultAddress = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
