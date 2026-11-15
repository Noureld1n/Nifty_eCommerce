package com.newtin.eco.repository;

import com.newtin.eco.enums.AdminActionType;
import com.newtin.eco.enums.AuditEntityType;
import com.newtin.eco.model.AdminActionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface AdminActionLogRepository extends Repository<AdminActionLog, Long> {

    AdminActionLog save(AdminActionLog log);

    @Query(value = """
            select l from AdminActionLog l
            left join fetch l.admin a left join fetch a.user
            where (:adminId is null or l.admin.id = :adminId)
              and (:entityType is null or l.entityType = :entityType)
              and (:entityId is null or l.entityId = :entityId)
              and (:action is null or l.actionType = :action)
            order by l.createdAt desc, l.id desc
            """,
            countQuery = """
            select count(l) from AdminActionLog l
            where (:adminId is null or l.admin.id = :adminId)
              and (:entityType is null or l.entityType = :entityType)
              and (:entityId is null or l.entityId = :entityId)
              and (:action is null or l.actionType = :action)
            """)
    Page<AdminActionLog> search(@Param("adminId") Long adminId,
                                @Param("entityType") AuditEntityType entityType,
                                @Param("entityId") Long entityId,
                                @Param("action") AdminActionType action,
                                Pageable pageable);
}