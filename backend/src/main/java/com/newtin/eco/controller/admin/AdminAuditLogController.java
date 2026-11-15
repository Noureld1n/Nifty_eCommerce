package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.response.AdminActionLogResponse;
import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.service.AdminActionLogService;
import com.newtin.eco.util.Pages;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {
    private final AdminActionLogService service;

    // read-only: there is intentionally no POST, PUT or DELETE
    @GetMapping
    public PagedModel<AdminActionLogResponse> list(@RequestParam(required = false) Long adminId,
                                                   @RequestParam(required = false) AuditEntityType entityType,
                                                   @RequestParam(required = false) Long entityId,
                                                   @RequestParam(required = false) AdminActionType action,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(service.search(adminId, entityType, entityId, action, Pages.of(page, size)));
    }
}