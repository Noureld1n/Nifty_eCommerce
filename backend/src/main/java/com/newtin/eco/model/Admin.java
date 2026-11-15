package com.newtin.eco.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "sys_admin")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Admin {
    @Id @Column(name = "admin_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @MapsId
    @JoinColumn(name = "admin_id")
    private User user;

    @Builder.Default
    @Column(name = "is_global", nullable = false)
    private boolean global = false;
}
