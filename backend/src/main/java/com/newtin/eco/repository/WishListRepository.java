package com.newtin.eco.repository;

import com.newtin.eco.model.WishListItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishListRepository extends JpaRepository<WishListItem, Long> {
    @EntityGraph(attributePaths = {"product"})
    List<WishListItem> findByCustomerIdOrderByAddedAtDesc(Long customerId);

    Optional<WishListItem> findByCustomerIdAndProductId(Long customerId, Long productId);

    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);
}
