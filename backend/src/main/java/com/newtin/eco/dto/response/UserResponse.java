package com.newtin.eco.dto.response;

import com.newtin.eco.enums.Role;
import com.newtin.eco.model.User;
import java.time.LocalDateTime;

public record UserResponse(Long id, String firstName, String lastName, String email,
                           String phone, Role role, String image, boolean active,
                           LocalDateTime registerDate) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                u.getPhone(), u.getRole(), u.getImage(), u.isActive(), u.getRegisterDate());
    }
}
