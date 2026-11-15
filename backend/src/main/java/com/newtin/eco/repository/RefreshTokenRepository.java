package com.newtin.eco.repository;

import com.newtin.eco.model.RefreshToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.user.id = :userId and r.revoked = false")
    void revokeAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from RefreshToken r where r.expiresAt < :now")
    void deleteExpired(@Param("now") LocalDateTime now);

    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.id = :id and r.revoked = false")
    int revokeIfActive(@Param("id") Long id);
}
