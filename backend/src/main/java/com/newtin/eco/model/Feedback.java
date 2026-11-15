package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "feedback")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Feedback {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, updatable = false)
    private Customer customer;

    @Column(name = "feedback_text", nullable = false)
    private String text;

    @Column(name = "is_satisfied")
    private Boolean satisfied;

    @CreationTimestamp
    @Column(name = "feedback_date", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}