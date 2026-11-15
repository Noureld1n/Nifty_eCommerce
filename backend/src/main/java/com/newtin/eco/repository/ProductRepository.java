package com.newtin.eco.repository;

import com.newtin.eco.enums.ProductType;
import com.newtin.eco.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @EntityGraph(attributePaths = {"category", "clothing", "accessory", "skincare"})
    @Query(value = "select p from Product p where p.active = true "
            + "and (p.category is null or p.category.active = true) "
            + "and (:categoryId is null or p.category.id = :categoryId) "
            + "and (:type is null or p.type = :type) order by p.createdAt desc, p.id desc",
            countQuery = "select count(p) from Product p where p.active = true "
                    + "and (p.category is null or p.category.active = true) "
                    + "and (:categoryId is null or p.category.id = :categoryId) "
                    + "and (:type is null or p.type = :type)")
    Page<Product> findPublic(@Param("categoryId") Long categoryId,
                             @Param("type") ProductType type, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "clothing", "accessory", "skincare"})
    @Query(value = "select p from Product p "
            + "where (:categoryId is null or p.category.id = :categoryId) "
            + "and (:type is null or p.type = :type) "
            + "and (:active is null or p.active = :active) order by p.createdAt desc, p.id desc",
            countQuery = "select count(p) from Product p "
                    + "where (:categoryId is null or p.category.id = :categoryId) "
                    + "and (:type is null or p.type = :type) "
                    + "and (:active is null or p.active = :active)")
    Page<Product> searchAdmin(@Param("categoryId") Long categoryId,
                              @Param("type") ProductType type,
                              @Param("active") Boolean active, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "clothing", "accessory", "skincare"})
    Optional<Product> findByIdAndActiveTrue(Long id);

    @EntityGraph(attributePaths = {"category", "clothing", "accessory", "skincare"})
    @Override
    Optional<Product> findById(Long id);
}
