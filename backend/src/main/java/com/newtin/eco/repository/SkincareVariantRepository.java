package com.newtin.eco.repository;

import com.newtin.eco.model.SkincareVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkincareVariantRepository extends JpaRepository<SkincareVariant, Long> {
    List<SkincareVariant> findBySkincareIdOrderByDefaultVariantDescIdAsc(Long productId);
    Optional<SkincareVariant> findByIdAndSkincareId(Long id, Long productId);
    Optional<SkincareVariant> findByVariantItemId(Long variantItemId);
    boolean existsBySkincareIdAndDefaultVariantTrue(Long productId);
}
