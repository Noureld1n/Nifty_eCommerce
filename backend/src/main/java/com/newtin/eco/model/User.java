package com.newtin.eco.model;
import com.newtin.eco.enums.Role;
import org.hibernate.annotations.DynamicUpdate;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "sys_user")
@DynamicUpdate
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100) private String firstName;
    @Column(name = "last_name", nullable = false, length = 100)  private String lastName;
    @Column(nullable = false, unique = true)                     private String email;
    @Column(name = "password_hash", nullable = false)            private String passwordHash;
    @Column(unique = true, length = 30)                          private String phone;

    @Column(name = "register_date", insertable = false, updatable = false)
    private LocalDateTime registerDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String image;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Builder.Default
    @Column(name = "token_version", nullable = false)
    private int tokenVersion = 0;

    @Builder.Default
    @Column(name = "failed_login_count", nullable = false, insertable = false, updatable = false)
    private int failedLoginCount = 0;

    @Column(name = "locked_until", insertable = false, updatable = false)
    private LocalDateTime lockedUntil;
}
