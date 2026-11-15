package com.newtin.eco.security;

import com.newtin.eco.enums.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Getter
public class CustomUserDetails implements UserDetails {
    private final Long id;
    private final String email;
    private final String password;     // null when built from the cache; JWT requests never need it
    private final Role role;
    private final boolean enabled;

    public CustomUserDetails(Long id, String email, String password, Role role, boolean enabled) {
        this.id = id; this.email = email; this.password = password;
        this.role = role; this.enabled = enabled;
    }

    public static CustomUserDetails from(AuthUserCache.Snapshot s) {
        return new CustomUserDetails(s.id(), s.email(), null, s.role(), s.active());
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }
    @Override public String getUsername() { return email; }
}