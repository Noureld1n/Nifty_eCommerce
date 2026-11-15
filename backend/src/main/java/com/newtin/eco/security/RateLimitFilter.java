package com.newtin.eco.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_MS = 60_000;
    private final Map<String, long[]> windows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !"POST".equals(req.getMethod()) || !req.getRequestURI().startsWith("/api/public/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        long now = System.currentTimeMillis();
        if (windows.size() > 10_000) windows.values().removeIf(w -> now - w[0] > WINDOW_MS);

        int[] count = new int[1];
        windows.compute(req.getRemoteAddr() + ":" + req.getRequestURI(), (k, w) -> {
            if (w == null || now - w[0] > WINDOW_MS) w = new long[]{now, 0};
            w[1]++;
            count[0] = (int) w[1];
            return w;
        });

        if (count[0] > MAX_REQUESTS) {
            res.setStatus(429);
            res.setHeader("Retry-After", "60");
            res.setContentType("application/json");
            res.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Try again in a minute\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}