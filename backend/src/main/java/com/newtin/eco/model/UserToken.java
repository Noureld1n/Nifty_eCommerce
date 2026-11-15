package com.newtin.eco.model;

import com.newtin.eco.enums.TokenType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "user_token")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_token_id")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false)
    private TokenType tokenType;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;
}