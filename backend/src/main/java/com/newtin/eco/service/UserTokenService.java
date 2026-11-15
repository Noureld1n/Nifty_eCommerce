package com.newtin.eco.service;

import com.newtin.eco.enums.TokenType;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.model.User;
import com.newtin.eco.model.UserToken;
import com.newtin.eco.repository.UserTokenRepository;
import com.newtin.eco.security.TokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserTokenService {
    private final UserTokenRepository repository;

    @Value("${app.tokens.verify-hours:24}")  private long verifyHours;
    @Value("${app.tokens.reset-minutes:30}") private long resetMinutes;

    @Transactional
    public String create(User user, TokenType type) {
        repository.deleteUnused(user.getId(), type);        // older links stop working
        String raw = TokenUtil.generate();
        LocalDateTime expires = type == TokenType.VERIFY_EMAIL
                ? LocalDateTime.now().plusHours(verifyHours)
                : LocalDateTime.now().plusMinutes(resetMinutes);
        repository.save(UserToken.builder()
                .user(user).tokenHash(TokenUtil.sha256(raw))
                .tokenType(type).expiresAt(expires).build());
        return raw;
    }

    @Transactional
    public User consume(String raw, TokenType type) {
        LocalDateTime now = LocalDateTime.now();
        UserToken token = repository.findByTokenHash(TokenUtil.sha256(raw))
                .filter(t -> t.getTokenType() == type && t.getUsedAt() == null
                        && t.getExpiresAt().isAfter(now))
                .orElseThrow(() -> new BadRequestException("Invalid or expired link"));
        if (repository.markUsed(token.getId(), now) == 0)
            throw new BadRequestException("Invalid or expired link");
        return token.getUser();
    }
}