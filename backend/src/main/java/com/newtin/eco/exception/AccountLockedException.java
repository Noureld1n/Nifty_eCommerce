package com.newtin.eco.exception;

/** Too many failed logins: the account is locked until the given number of seconds pass. Mapped to 429 + Retry-After. */
public class AccountLockedException extends RuntimeException {
    private final long retryAfterSeconds;

    public AccountLockedException(long retryAfterSeconds) {
        super("Too many failed attempts. Try again later.");
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public long getRetryAfterSeconds() { return retryAfterSeconds; }
}