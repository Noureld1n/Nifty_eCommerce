package com.newtin.eco.security;

import com.newtin.eco.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public CustomUserDetails loadUserByUsername(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .map(u -> new CustomUserDetails(u.getId(), u.getEmail(), u.getPasswordHash(),
                        u.getRole(), u.isActive()))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}