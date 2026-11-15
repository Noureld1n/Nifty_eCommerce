package com.newtin.eco.controller;

import com.newtin.eco.dto.request.ChangePasswordRequest;
import com.newtin.eco.dto.request.UpdateProfileRequest;
import com.newtin.eco.dto.response.UserResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal CustomUserDetails principal) {
        return userService.getById(principal.getId());
    }

    @PutMapping("/me")
    public UserResponse update(@AuthenticationPrincipal CustomUserDetails principal,
                               @Valid @RequestBody UpdateProfileRequest req) {
        return userService.updateProfile(principal.getId(), req);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal CustomUserDetails principal,
                                               @Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(principal.getId(), req);
        return ResponseEntity.noContent().build();
    }
}
