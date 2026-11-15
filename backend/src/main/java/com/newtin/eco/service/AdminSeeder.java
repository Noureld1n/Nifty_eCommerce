package com.newtin.eco.service;

import com.newtin.eco.enums.Role;
import com.newtin.eco.model.Admin;
import com.newtin.eco.model.User;
import com.newtin.eco.repository.AdminRepository;
import com.newtin.eco.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {
    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin-seed.email:}")    private String email;
    @Value("${app.admin-seed.password:}") private String password;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank() || adminRepository.count() > 0) return;

        User user = userRepository.save(User.builder()
                .firstName("System")
                .lastName("Admin")
                .email(email.trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(password))
                .role(Role.ROLE_ADMIN)
                .emailVerified(true)
                .build());

        adminRepository.save(Admin.builder()
                .user(user)
                .global(true)
                .build());
    }
}