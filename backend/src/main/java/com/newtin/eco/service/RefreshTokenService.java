package com.newtin.eco.service;

import com.newtin.eco.model.RefreshToken;
import com.newtin.eco.model.User;
import com.newtin.eco.repository.RefreshTokenRepository;
import com.newtin.eco.security.TokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository repository;

    @Value("${app.jwt.refresh-days}")
    private long refreshDays;

    @Transactional
    public String issue(User user) {
        String raw = TokenUtil.generate();
        repository.save(RefreshToken.builder()
                .user(user)
                .tokenHash(TokenUtil.sha256(raw))
                .expiresAt(LocalDateTime.now().plusDays(refreshDays))
                .build());
        return raw;
    }

    /** Validates and revokes the presented token (rotation). Returns its owner. */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public User consume(String raw) {
        if (raw == null || raw.isBlank()) throw new BadCredentialsException("Invalid refresh token");
        RefreshToken token = repository.findByTokenHash(TokenUtil.sha256(raw))
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (token.isRevoked()) {
            // an already-rotated token was presented later: assume theft
            repository.revokeAllByUserId(token.getUser().getId());
            throw new BadCredentialsException("Invalid refresh token");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new BadCredentialsException("Invalid refresh token");

        // Lost a race with a concurrent refresh using the same cookie (e.g. two tabs):
        // reject only this request. It's ambiguous (legit race or theft), so don't nuke every session.
        if (repository.revokeIfActive(token.getId()) == 0)
            throw new BadCredentialsException("Invalid refresh token");

        return token.getUser();
    }

    @Transactional
    public void revoke(String raw) {                       // logout: idempotent
        if (raw == null || raw.isBlank()) return;
        repository.findByTokenHash(TokenUtil.sha256(raw)).ifPresent(t -> t.setRevoked(true));
    }

    @Transactional
    public void revokeAll(Long userId) { repository.revokeAllByUserId(userId); }
}