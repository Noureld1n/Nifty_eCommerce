package com.newtin.eco.controller;

import com.newtin.eco.dto.request.*;
import com.newtin.eco.dto.response.AuthResponse;
import com.newtin.eco.dto.response.MessageResponse;
import com.newtin.eco.service.AccountService;
import com.newtin.eco.service.AuthService;
import com.newtin.eco.service.AuthService.AuthResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;

@RestController
@RequestMapping("/api/public/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final String COOKIE = "refresh_token";

    private final AuthService authService;
    private final AccountService accountService;

    @Value("${app.cookie-secure}")    private boolean cookieSecure;
    @Value("${app.jwt.refresh-days}") private long refreshDays;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return withCookie(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@CookieValue(name = COOKIE, required = false) String token) {
        return withCookie(authService.refresh(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = COOKIE, required = false) String token) {
        authService.logout(token);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString()).build();
    }

    @PostMapping("/verify-email")
    public MessageResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return accountService.verifyEmail(req.token());
    }

    @PostMapping("/resend-verification")
    public MessageResponse resend(@Valid @RequestBody EmailRequest req) {
        return accountService.resendVerification(req.email());
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgot(@Valid @RequestBody EmailRequest req) {
        return accountService.forgotPassword(req.email());
    }

    @PostMapping("/reset-password")
    public MessageResponse reset(@Valid @RequestBody ResetPasswordRequest req) {
        return accountService.resetPassword(req.token(), req.newPassword());
    }

    private ResponseEntity<AuthResponse> withCookie(AuthResult r) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(r.refreshToken(), Duration.ofDays(refreshDays)).toString())
                .body(r.response());
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from(COOKIE, value)
                .httpOnly(true)                 // JavaScript can't read it, so XSS can't steal it
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/public/auth")       // only sent to the auth endpoints
                .maxAge(maxAge)
                .build();
    }
}