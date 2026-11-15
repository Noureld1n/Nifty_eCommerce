package com.newtin.eco.service;

import com.newtin.eco.dto.request.ChangePasswordRequest;
import com.newtin.eco.dto.request.UpdateProfileRequest;
import com.newtin.eco.dto.response.UserResponse;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.exception.ConflictException;
import com.newtin.eco.exception.ResourceNotFoundException;
import com.newtin.eco.model.User;
import com.newtin.eco.security.AuthUserCache;
import com.newtin.eco.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.newtin.eco.enums.Role;
import com.newtin.eco.model.Admin;
import com.newtin.eco.repository.AdminRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminRepository adminRepository;
    private final RefreshTokenService refreshTokenService;
    private final AuthUserCache authUserCache;
    private final AdminActionLogService actionLogService;

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) { return UserResponse.from(find(id)); }

    @Transactional
    public UserResponse updateProfile(Long id, UpdateProfileRequest req) {
        User user = find(id);
        String phone = AuthService.blankToNull(req.phone());
        if (phone != null && userRepository.existsByPhoneAndIdNot(phone, id))
            throw new ConflictException("Phone already in use");

        user.setFirstName(req.firstName().trim());
        user.setLastName(req.lastName().trim());
        user.setPhone(phone);
        user.setImage(AuthService.blankToNull(req.image()));
        return UserResponse.from(user);   // dirty checking saves on commit
    }

    @Transactional
    public UserResponse setActive(Long actingAdminId, Long targetId, boolean active) {
        if (actingAdminId.equals(targetId) && !active)
            throw new ConflictException("You cannot deactivate your own account");

        User target = find(targetId);

        if (target.getRole() == Role.ROLE_ADMIN && !actingAdminId.equals(targetId)) {
            Admin acting = adminRepository.findById(actingAdminId)
                    .orElseThrow(() -> new AccessDeniedException("Admin record not found"));
            if (!acting.isGlobal())
                throw new AccessDeniedException("Only a global admin can modify another admin");
        }

        boolean before = target.isActive();
        if (before == active) return UserResponse.from(target);    // no change, nothing to log

        target.setActive(active);
        authUserCache.evictAfterCommit(targetId);
        actionLogService.log(actingAdminId,
                active ? AdminActionType.USER_ACTIVATED : AdminActionType.USER_DEACTIVATED,
                AuditEntityType.USER, targetId,
                "User #" + targetId + (active ? " activated" : " deactivated"),
                Map.of("active", before), Map.of("active", active));
        return UserResponse.from(target);
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest req) {
        User user = find(id);
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash()))
            throw new BadRequestException("Current password is incorrect");
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash()))
            throw new BadRequestException("New password must be different from the current one");

        userRepository.updatePassword(id, passwordEncoder.encode(req.newPassword()));
        refreshTokenService.revokeAll(id);
        authUserCache.evictAfterCommit(id);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> list(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserResponse::from);
    }



    private User find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
