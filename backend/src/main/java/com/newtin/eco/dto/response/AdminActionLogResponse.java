package com.newtin.eco.dto.response;

import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import java.time.LocalDateTime;
import java.util.Map;

public record AdminActionLogResponse(Long id, Long adminId, String adminName, String adminEmail,
                                     AdminActionType action, AuditEntityType entityType, Long entityId,
                                     String description, Map<String, Object> oldValues,
                                     Map<String, Object> newValues, String ipAddress,
                                     LocalDateTime createdAt) {}