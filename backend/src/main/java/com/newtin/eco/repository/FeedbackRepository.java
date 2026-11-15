package com.newtin.eco.repository;

import com.newtin.eco.model.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    @Query(value = "select f from Feedback f where f.customer.id = :cid order by f.createdAt desc, f.id desc",
            countQuery = "select count(f) from Feedback f where f.customer.id = :cid")
    Page<Feedback> findMine(@Param("cid") Long customerId, Pageable pageable);

    @Query(value = "select f from Feedback f join fetch f.customer c join fetch c.user "
            + "where (:satisfied is null or f.satisfied = :satisfied) "
            + "order by f.createdAt desc, f.id desc",
            countQuery = "select count(f) from Feedback f where (:satisfied is null or f.satisfied = :satisfied)")
    Page<Feedback> findAllForAdmin(@Param("satisfied") Boolean satisfied, Pageable pageable);

    long countByCustomerIdAndCreatedAtAfter(Long customerId, LocalDateTime since);
}