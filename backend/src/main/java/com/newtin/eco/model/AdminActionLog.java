package com.newtin.eco.model;

import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;
import java.time.LocalDateTime;

// Read-only on purpose: getters and a builder, no setters.
@Entity @Table(name = "admin_action_log") @Immutable
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED) @AllArgsConstructor @Builder
public class AdminActionLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "action_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", updatable = false)
    private Admin admin;                       // null = system action

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, updatable = false)
    private AdminActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, updatable = false)
    private AuditEntityType entityType;

    @Column(name = "entity_id", updatable = false)
    private Long entityId;

    @Column(name = "action_description", updatable = false)
    private String description;

    // JSON columns are mapped as plain text and serialized by the service
    @Column(name = "old_values", updatable = false)
    private String oldValues;

    @Column(name = "new_values", updatable = false)
    private String newValues;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}