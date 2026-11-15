package com.newtin.eco.event;

import com.newtin.eco.enums.TokenType;

public record AccountMailEvent(String to, String firstName, String token, TokenType type) {}