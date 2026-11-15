package com.newtin.eco.dto.response;

import com.newtin.eco.enums.CartStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CartResponse(
        Long id,
        CartStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<CartItemResponse> items,
        BigDecimal total
) {}
