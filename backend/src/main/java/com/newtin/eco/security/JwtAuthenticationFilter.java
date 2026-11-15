package com.newtin.eco.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final AuthUserCache authUserCache;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtService.parse(header.substring(7));
                Integer tv = claims.get("tv", Integer.class);
                authUserCache.find(Long.valueOf(claims.getSubject()))
                        .filter(s -> s.active() && tv != null && tv == s.tokenVersion())
                        .ifPresent(s -> {
                            CustomUserDetails details = CustomUserDetails.from(s);
                            var auth = new UsernamePasswordAuthenticationToken(
                                    details, null, details.getAuthorities());
                            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        });
            } catch (JwtException | IllegalArgumentException e) {
                SecurityContextHolder.clearContext();   // unauthenticated -> 401
            }
        }
        chain.doFilter(request, response);
    }
}