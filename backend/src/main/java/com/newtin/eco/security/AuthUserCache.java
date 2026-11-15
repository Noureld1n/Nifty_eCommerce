package com.newtin.eco.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.newtin.eco.enums.Role;
import com.newtin.eco.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.Duration;
import java.util.Optional;

/** Holds only what authentication needs, for a few seconds. */
@Component
public class AuthUserCache {
    public record Snapshot(Long id, String email, Role role, boolean active, int tokenVersion) {}

    private final UserRepository userRepository;
    private final Cache<Long, Snapshot> cache;

    public AuthUserCache(UserRepository userRepository,
                         @Value("${app.auth-cache.ttl-seconds:45}") long ttlSeconds,
                         @Value("${app.auth-cache.max-size:10000}") long maxSize) {
        this.userRepository = userRepository;
        this.cache = Caffeine.newBuilder()
                .maximumSize(maxSize)
                .expireAfterWrite(Duration.ofSeconds(ttlSeconds))
                .build();
    }

    public Optional<Snapshot> find(Long id) {
        // loader returning null = "no such user", and nothing is cached for it
        return Optional.ofNullable(cache.get(id, key -> userRepository.findById(key)
                .map(u -> new Snapshot(u.getId(), u.getEmail(), u.getRole(),
                        u.isActive(), u.getTokenVersion()))
                .orElse(null)));
    }

    /** Evict only after the change is committed, so a concurrent request can't re-cache the old row. */
    public void evictAfterCommit(Long id) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { cache.invalidate(id); }
            });
        } else {
            cache.invalidate(id);
        }
    }
}