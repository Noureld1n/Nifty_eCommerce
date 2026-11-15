package com.newtin.eco.dto.response;

import com.newtin.eco.model.Provider;

import java.time.LocalDateTime;

public record ProviderResponse(Long id, String name, String email, String phone, boolean active,
                               LocalDateTime createdAt) {
    public static ProviderResponse from(Provider provider) {
        return new ProviderResponse(provider.getId(), provider.getName(), provider.getEmail(),
                provider.getPhone(), provider.isActive(), provider.getCreatedAt());
    }
}
