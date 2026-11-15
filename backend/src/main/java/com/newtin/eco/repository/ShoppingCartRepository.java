package com.newtin.eco.repository;

import com.newtin.eco.enums.CartStatus;
import com.newtin.eco.model.ShoppingCart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    @EntityGraph(attributePaths = {"items", "items.variantItem"})
    Optional<ShoppingCart> findByCustomerIdAndStatus(Long customerId, CartStatus status);
}
