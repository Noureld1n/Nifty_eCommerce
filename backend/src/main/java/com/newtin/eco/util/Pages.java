package com.newtin.eco.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

public final class Pages {
    private Pages() {}

    public static Pageable of(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    }
}