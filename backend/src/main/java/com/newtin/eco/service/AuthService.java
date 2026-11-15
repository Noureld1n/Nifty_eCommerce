package com.newtin.eco.service;

import com.newtin.eco.dto.request.LoginRequest;
import com.newtin.eco.dto.request.RegisterRequest;
import com.newtin.eco.dto.response.AuthResponse;
import com.newtin.eco.dto.response.MessageResponse;
import com.newtin.eco.dto.response.UserResponse;
import com.newtin.eco.enums.Role;
import com.newtin.eco.enums.TokenType;
import com.newtin.eco.event.AccountMailEvent;
import com.newtin.eco.exception.AccountLockedException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.EmailNotVerifiedException;
import com.newtin.eco.model.Customer;
import com.newtin.eco.model.User;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.UserRepository;
import com.newtin.eco.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserTokenService userTokenService;
    private final ApplicationEventPublisher events;
    private final TransactionTemplate tx;
    private final MailService mailService;

    // not final on purpose: Lombok leaves them out of the constructor and Spring injects them
    @Value("${app.security.max-failed-logins:5}") private int maxFailedLogins;
    @Value("${app.security.lock-minutes:15}")     private int lockMinutes;

    /** Body goes to JSON, refresh token goes to the HttpOnly cookie. */
    public record AuthResult(AuthResponse response, String refreshToken) {}


    public MessageResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        String phone = blankToNull(req.phone());

        // cheap checks first so duplicates never pay for BCrypt
        if (userRepository.existsByEmail(email)) throw new ConflictException("Email already registered");
        if (phone != null && userRepository.existsByPhone(phone))
            throw new ConflictException("Phone already registered");

        String hash = passwordEncoder.encode(req.password());      // ~100ms, no DB connection held

        // A race on the UNIQUE keys throws DataIntegrityViolationException -> 409 in the handler
        tx.executeWithoutResult(status -> {
            User user = userRepository.save(User.builder()
                    .firstName(req.firstName().trim())
                    .lastName(req.lastName().trim())
                    .email(email)
                    .phone(phone)
                    .passwordHash(hash)
                    .role(Role.ROLE_CUSTOMER)
                    .build());
            customerRepository.save(Customer.builder().user(user).build());
            String token = userTokenService.create(user, TokenType.VERIFY_EMAIL);
            // delivered only if this transaction commits
            events.publishEvent(new AccountMailEvent(user.getEmail(), user.getFirstName(),
                    token, TokenType.VERIFY_EMAIL));
        });
        return new MessageResponse("Registration successful. Check your email to verify your account.");
    }


    public AuthResult login(LoginRequest req) {
        // read + BCrypt run with no transaction open
        User user = userRepository.findByEmail(req.email().trim().toLowerCase()).orElse(null);

        // 1. Locked? Answer 429 before looking at the password, so a correct guess during
        //    the lock tells an attacker nothing and the wrong ones don't extend it.
        if (user != null && user.getLockedUntil() != null) {
            long left = Duration.between(LocalDateTime.now(), user.getLockedUntil()).toSeconds();
            if (left > 0) throw new AccountLockedException(left);
        }

        // 2. Wrong password or deactivated account counts as a failure.
        boolean ok = user != null
                && passwordEncoder.matches(req.password(), user.getPasswordHash())
                && user.isActive();
        if (!ok) {
            if (user != null) registerFailure(user);
            throw new BadCredentialsException("Invalid email or password");
        }

        // 3. Correct password: forget earlier failures (a write only when there is something to clear).
        if (user.getFailedLoginCount() > 0 || user.getLockedUntil() != null)
            tx.executeWithoutResult(s -> userRepository.clearFailedLogins(user.getId()));

        if (!user.isEmailVerified()) throw new EmailNotVerifiedException();
        return tx.execute(status -> issueTokens(user));            // transaction only for the token write
    }

    /** Counts the failure (committed before we throw) and turns it into a 429 if it just locked the account. */
    private void registerFailure(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime until = now.plusMinutes(lockMinutes);
        tx.executeWithoutResult(s -> userRepository.recordFailedLogin(user.getId(), now, maxFailedLogins, until));

        userRepository.findLockedUntil(user.getId()).ifPresent(lockedUntil -> {
            long left = Duration.between(LocalDateTime.now(), lockedUntil).toSeconds();
            if (left > 0) throw new AccountLockedException(left);
        });
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public AuthResult refresh(String rawRefreshToken) {
        User user = refreshTokenService.consume(rawRefreshToken);
        if (!user.isActive() || !user.isEmailVerified())
            throw new BadCredentialsException("Invalid refresh token");
        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) { refreshTokenService.revoke(rawRefreshToken); }

    private AuthResult issueTokens(User user) {
        AuthResponse body = new AuthResponse(jwtService.generateToken(user), "Bearer",
                jwtService.getExpiresInSeconds(), UserResponse.from(user));
        return new AuthResult(body, refreshTokenService.issue(user));
    }

    static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}




//package com.newtin.eco.service;
//
//import com.newtin.eco.dto.request.LoginRequest;
//import com.newtin.eco.dto.request.RegisterRequest;
//import com.newtin.eco.dto.response.AuthResponse;
//import com.newtin.eco.dto.response.MessageResponse;
//import com.newtin.eco.dto.response.UserResponse;
//import com.newtin.eco.enums.Role;
//import com.newtin.eco.enums.TokenType;
//import com.newtin.eco.event.AccountMailEvent;
//import com.newtin.eco.exception.ConflictException;
//import com.newtin.eco.exception.EmailNotVerifiedException;
//import com.newtin.eco.model.Customer;
//import com.newtin.eco.model.User;
//import com.newtin.eco.repository.CustomerRepository;
//import com.newtin.eco.repository.UserRepository;
//import com.newtin.eco.security.JwtService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.context.ApplicationEventPublisher;
//import org.springframework.security.authentication.BadCredentialsException;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.transaction.support.TransactionTemplate;
//
//@Service
//@RequiredArgsConstructor
//public class AuthService {
//    private final UserRepository userRepository;
//    private final CustomerRepository customerRepository;
//    private final PasswordEncoder passwordEncoder;
//    private final JwtService jwtService;
//    private final RefreshTokenService refreshTokenService;
//    private final UserTokenService userTokenService;
//    private final ApplicationEventPublisher events;
//    private final TransactionTemplate tx;
//    private final MailService mailService;
//
//    /** Body goes to JSON, refresh token goes to the HttpOnly cookie. */
//    public record AuthResult(AuthResponse response, String refreshToken) {}
//
//
//    public MessageResponse register(RegisterRequest req) {
//        String email = req.email().trim().toLowerCase();
//        String phone = blankToNull(req.phone());
//
//        // cheap checks first so duplicates never pay for BCrypt
//        if (userRepository.existsByEmail(email)) throw new ConflictException("Email already registered");
//        if (phone != null && userRepository.existsByPhone(phone))
//            throw new ConflictException("Phone already registered");
//
//        String hash = passwordEncoder.encode(req.password());      // ~100ms, no DB connection held
//
//        // A race on the UNIQUE keys throws DataIntegrityViolationException -> 409 in the handler
//        tx.executeWithoutResult(status -> {
//            User user = userRepository.save(User.builder()
//                    .firstName(req.firstName().trim())
//                    .lastName(req.lastName().trim())
//                    .email(email)
//                    .phone(phone)
//                    .passwordHash(hash)
//                    .role(Role.ROLE_CUSTOMER)
//                    .build());
//            customerRepository.save(Customer.builder().user(user).build());
//            String token = userTokenService.create(user, TokenType.VERIFY_EMAIL);
//            // delivered only if this transaction commits
//            events.publishEvent(new AccountMailEvent(user.getEmail(), user.getFirstName(),
//                    token, TokenType.VERIFY_EMAIL));
//        });
//        return new MessageResponse("Registration successful. Check your email to verify your account.");
//    }
//
//
//    public AuthResult login(LoginRequest req) {
//        // read + BCrypt run with no transaction open
//        User user = userRepository.findByEmail(req.email().trim().toLowerCase())
//                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
//                .filter(User::isActive)
//                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
//        if (!user.isEmailVerified()) throw new EmailNotVerifiedException();
//        return tx.execute(status -> issueTokens(user));            // transaction only for the token write
//    }
//
//    @Transactional(noRollbackFor = BadCredentialsException.class)
//    public AuthResult refresh(String rawRefreshToken) {
//        User user = refreshTokenService.consume(rawRefreshToken);
//        if (!user.isActive() || !user.isEmailVerified())
//            throw new BadCredentialsException("Invalid refresh token");
//        return issueTokens(user);
//    }
//
//    @Transactional
//    public void logout(String rawRefreshToken) { refreshTokenService.revoke(rawRefreshToken); }
//
//    private AuthResult issueTokens(User user) {
//        AuthResponse body = new AuthResponse(jwtService.generateToken(user), "Bearer",
//                jwtService.getExpiresInSeconds(), UserResponse.from(user));
//        return new AuthResult(body, refreshTokenService.issue(user));
//    }
//
//    static String blankToNull(String s) {
//        return (s == null || s.isBlank()) ? null : s.trim();
//    }
//}