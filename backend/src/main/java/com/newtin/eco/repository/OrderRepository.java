package com.newtin.eco.repository;

import com.newtin.eco.enums.OrderStatus;
import com.newtin.eco.enums.PaymentStatus;
import com.newtin.eco.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query(value = "select o from Order o where o.customer.id = :customerId "
            + "order by o.createdAt desc, o.id desc",
            countQuery = "select count(o) from Order o where o.customer.id = :customerId")
    Page<Order> findMine(@Param("customerId") Long customerId, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "customer.user"})
    Optional<Order> findByIdAndCustomerId(Long id, Long customerId);

    @Query(value = "select o from Order o "
            + "where (:status is null or o.status = :status) "
            + "and (:paymentStatus is null or o.paymentStatus = :paymentStatus) "
            + "order by o.createdAt desc, o.id desc",
            countQuery = "select count(o) from Order o "
                    + "where (:status is null or o.status = :status) "
                    + "and (:paymentStatus is null or o.paymentStatus = :paymentStatus)")
    Page<Order> searchForAdmin(@Param("status") OrderStatus status,
                               @Param("paymentStatus") PaymentStatus paymentStatus,
                               Pageable pageable);
}
