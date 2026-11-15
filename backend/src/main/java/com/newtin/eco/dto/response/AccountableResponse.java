package com.newtin.eco.dto.response;

import com.newtin.eco.model.Accountable;

import java.time.LocalDateTime;

public record AccountableResponse(Long id, String name, String email, String phone, boolean active,
                                  LocalDateTime createdAt) {
    public static AccountableResponse from(Accountable accountable) {
        return new AccountableResponse(accountable.getId(), accountable.getName(),
                accountable.getEmail(), accountable.getPhone(), accountable.isActive(),
                accountable.getCreatedAt());
    }
}
