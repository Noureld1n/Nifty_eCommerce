package com.newtin.eco.repository;
import com.newtin.eco.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);

    // version bump happens inside the DB: no read-modify-write, no lost increments.
    // A new password also clears any lockout, so a locked customer can recover through "forgot password".
    @Modifying
    @Query("update User u set u.passwordHash = :hash, u.tokenVersion = u.tokenVersion + 1, "
            + "u.failedLoginCount = 0, u.lockedUntil = null where u.id = :id")
    int updatePassword(@Param("id") Long id, @Param("hash") String hash);

    @Modifying
    @Query("update User u set u.passwordHash = :hash, u.tokenVersion = u.tokenVersion + 1, "
            + "u.emailVerified = true, u.failedLoginCount = 0, u.lockedUntil = null where u.id = :id")
    int resetPasswordAndVerify(@Param("id") Long id, @Param("hash") String hash);

    /**
     * Counts one failed login atomically (parallel guesses cannot slip past the limit).
     * If an earlier lock has already expired the count starts again at 1.
     * MySQL evaluates SET assignments left to right, so the lockedUntil line sees the NEW count.
     */
    @Modifying
    @Query("update User u set "
            + "u.failedLoginCount = case when u.lockedUntil is not null and u.lockedUntil <= :now "
            + "then 1 else u.failedLoginCount + 1 end, "
            + "u.lockedUntil = case when u.failedLoginCount >= :max then :until else null end "
            + "where u.id = :id")
    int recordFailedLogin(@Param("id") Long id, @Param("now") LocalDateTime now,
                          @Param("max") int max, @Param("until") LocalDateTime until);

    @Modifying
    @Query("update User u set u.failedLoginCount = 0, u.lockedUntil = null where u.id = :id")
    int clearFailedLogins(@Param("id") Long id);

    @Query("select u.lockedUntil from User u where u.id = :id")
    Optional<LocalDateTime> findLockedUntil(@Param("id") Long id);

}
