package com.newtin.eco.config;

import com.newtin.eco.repository.RefreshTokenRepository;
import com.newtin.eco.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class TokenCleanupJob {
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserTokenRepository userTokenRepository;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpired() {
        LocalDateTime now = LocalDateTime.now();
        refreshTokenRepository.deleteExpired(now);
        userTokenRepository.deleteExpired(now);
    }
}