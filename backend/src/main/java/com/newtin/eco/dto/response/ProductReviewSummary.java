package com.newtin.eco.dto.response;

import java.math.BigDecimal;

public record ProductReviewSummary(long reviewCount, BigDecimal averageRating) {}
