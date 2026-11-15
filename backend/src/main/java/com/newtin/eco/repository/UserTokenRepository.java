package com.newtin.eco.repository;

import com.newtin.eco.enums.TokenType;
import com.newtin.eco.model.UserToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from UserToken t where t.user.id = :userId and t.tokenType = :type and t.usedAt is null")
    void deleteUnused(@Param("userId") Long userId, @Param("type") TokenType type);

    // atomic: only one caller can ever mark a token used
    @Modifying
    @Query("update UserToken t set t.usedAt = :now where t.id = :id and t.usedAt is null")
    int markUsed(@Param("id") Long id, @Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from UserToken t where t.expiresAt < :now")
    void deleteExpired(@Param("now") LocalDateTime now);
}
