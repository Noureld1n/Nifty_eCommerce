package com.newtin.eco.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull Boolean active) {}
