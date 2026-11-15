package com.newtin.eco.service;

import com.newtin.eco.dto.response.AdminActionLogResponse;
import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.model.AdminActionLog;
import com.newtin.eco.model.User;
import com.newtin.eco.repository.AdminActionLogRepository;
import com.newtin.eco.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tools.jackson.databind.json.JsonMapper;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminActionLogService {
    // Keys that must never be written to an audit log (compared lowercase, underscores removed)
    private static final Set<String> FORBIDDEN_KEYS =
            Set.of("password", "passwordhash", "token", "tokenhash", "providertoken", "secret");
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final AdminActionLogRepository repository;
    private final AdminRepository adminRepository;

    /**
     * MANDATORY: callable only inside the transaction of the action being logged,
     * so the log row and the change commit together or not at all.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void log(Long adminId, AdminActionType action, AuditEntityType entityType, Long entityId,
                    String description, Map<String, Object> oldValues, Map<String, Object> newValues) {
        repository.save(AdminActionLog.builder()
                .admin(adminId == null ? null : adminRepository.getReferenceById(adminId))
                .actionType(action)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .oldValues(toJson(oldValues))
                .newValues(toJson(newValues))
                .ipAddress(currentIp())
                .build());
    }

    @Transactional(readOnly = true)
    public Page<AdminActionLogResponse> search(Long adminId, AuditEntityType entityType, Long entityId,
                                               AdminActionType action, Pageable pageable) {
        return repository.search(adminId, entityType, entityId, action, pageable).map(this::toResponse);
    }

    private AdminActionLogResponse toResponse(AdminActionLog l) {
        User u = l.getAdmin() == null ? null : l.getAdmin().getUser();
        return new AdminActionLogResponse(l.getId(),
                l.getAdmin() == null ? null : l.getAdmin().getId(),
                u == null ? null : u.getFirstName() + " " + u.getLastName(),
                u == null ? null : u.getEmail(),
                l.getActionType(), l.getEntityType(), l.getEntityId(), l.getDescription(),
                fromJson(l.getOldValues()), fromJson(l.getNewValues()),
                l.getIpAddress(), l.getCreatedAt());
    }

    private String toJson(Map<String, Object> values) {
        if (values == null) return null;
        for (String key : values.keySet()) {
            if (FORBIDDEN_KEYS.contains(key.toLowerCase().replace("_", "")))
                throw new IllegalArgumentException("Sensitive field must not be written to the audit log: " + key);
        }
        return JSON.writeValueAsString(values);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fromJson(String json) {
        return (json == null || json.isBlank()) ? null : JSON.readValue(json, Map.class);
    }

    private String currentIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            String ip = attrs.getRequest().getRemoteAddr();
            return ip == null ? null : (ip.length() > 45 ? ip.substring(0, 45) : ip);
        }
        return null;
    }
}