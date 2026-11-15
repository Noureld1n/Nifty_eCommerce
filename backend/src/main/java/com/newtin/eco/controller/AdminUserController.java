package com.newtin.eco.controller;

import com.newtin.eco.dto.request.UpdateStatusRequest;
import com.newtin.eco.dto.response.UserResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserService userService;

    @GetMapping
    public PagedModel<UserResponse> list(Pageable pageable) {
        return new PagedModel<>(userService.list(pageable));
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) { return userService.getById(id); }

    @PatchMapping("/{id}/status")
    public UserResponse setStatus(@AuthenticationPrincipal CustomUserDetails admin,
                                  @PathVariable Long id,
                                  @Valid @RequestBody UpdateStatusRequest req) {
        return userService.setActive(admin.getId(), id, req.active());
    }
}
