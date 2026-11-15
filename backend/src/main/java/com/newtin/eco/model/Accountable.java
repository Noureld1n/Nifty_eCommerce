package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "accountable")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Accountable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "accountable_id")
    private Long id;

    @Column(name = "accountable_name", nullable = false, length = 200)
    private String name;

    @Column(length = 255)
    private String email;

    @Column(length = 30)
    private String phone;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
