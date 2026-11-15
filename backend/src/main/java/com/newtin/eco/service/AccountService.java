package com.newtin.eco.service;

import com.newtin.eco.dto.response.MessageResponse;
import com.newtin.eco.enums.TokenType;
import com.newtin.eco.event.AccountMailEvent;
import com.newtin.eco.model.User;
import com.newtin.eco.repository.UserRepository;
import com.newtin.eco.security.AuthUserCache;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final UserRepository userRepository;
    private final UserTokenService userTokenService;
    private final RefreshTokenService refreshTokenService;
    private final ApplicationEventPublisher events;
    private final PasswordEncoder passwordEncoder;
    private final AuthUserCache authUserCache;

    @Transactional
    public MessageResponse verifyEmail(String token) {
        User user = userTokenService.consume(token, TokenType.VERIFY_EMAIL);
        user.setEmailVerified(true);
        return new MessageResponse("Email verified. You can now log in.");
    }

    // Same response whether or not the email exists, so it can't be used to probe accounts
    @Transactional
    public MessageResponse resendVerification(String email) {
        userRepository.findByEmail(email.trim().toLowerCase())
                .filter(u -> u.isActive() && !u.isEmailVerified())
                .ifPresent(u -> events.publishEvent(new AccountMailEvent(u.getEmail(), u.getFirstName(),
                        userTokenService.create(u, TokenType.VERIFY_EMAIL), TokenType.VERIFY_EMAIL)));
        return new MessageResponse("If the account exists and is unverified, a new email was sent.");
    }

    @Transactional
    public MessageResponse forgotPassword(String email) {
        userRepository.findByEmail(email.trim().toLowerCase())
                .filter(User::isActive)
                .ifPresent(u -> events.publishEvent(new AccountMailEvent(u.getEmail(), u.getFirstName(),
                        userTokenService.create(u, TokenType.RESET_PASSWORD), TokenType.RESET_PASSWORD)));
        return new MessageResponse("If the account exists, a reset email was sent.");
    }

    @Transactional
    public MessageResponse resetPassword(String token, String newPassword) {
        User user = userTokenService.consume(token, TokenType.RESET_PASSWORD);
        // one atomic statement: new hash, tokenVersion + 1, and verified (they own the mailbox)
        userRepository.resetPasswordAndVerify(user.getId(), passwordEncoder.encode(newPassword));
        refreshTokenService.revokeAll(user.getId());
        authUserCache.evictAfterCommit(user.getId());
        return new MessageResponse("Password updated. Please log in.");
    }
}