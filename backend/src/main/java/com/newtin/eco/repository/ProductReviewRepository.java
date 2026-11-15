package com.newtin.eco.repository;

import com.newtin.eco.model.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    @EntityGraph(attributePaths = {"customer", "customer.user", "product"})
    @Query(value = "select r from ProductReview r where r.product.id = :productId "
            + "order by r.createdAt desc, r.id desc",
            countQuery = "select count(r) from ProductReview r where r.product.id = :productId")
    Page<ProductReview> findForProduct(@Param("productId") Long productId, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "customer.user", "product"})
    @Query(value = "select r from ProductReview r where r.customer.id = :customerId "
            + "order by r.createdAt desc, r.id desc",
            countQuery = "select count(r) from ProductReview r where r.customer.id = :customerId")
    Page<ProductReview> findMine(@Param("customerId") Long customerId, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "customer.user", "product"})
    Optional<ProductReview> findByIdAndCustomerId(Long id, Long customerId);

    long countByProductId(Long productId);

    @Query("select avg(r.rating) from ProductReview r where r.product.id = :productId")
    Double averageRating(@Param("productId") Long productId);

    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);
}
