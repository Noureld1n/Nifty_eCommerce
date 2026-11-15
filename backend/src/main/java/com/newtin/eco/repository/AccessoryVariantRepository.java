package com.newtin.eco.repository;

import com.newtin.eco.model.AccessoryVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccessoryVariantRepository extends JpaRepository<AccessoryVariant, Long> {
    List<AccessoryVariant> findByAccessoryIdOrderByDefaultVariantDescIdAsc(Long productId);
    Optional<AccessoryVariant> findByIdAndAccessoryId(Long id, Long productId);
    Optional<AccessoryVariant> findByVariantItemId(Long variantItemId);
    boolean existsByAccessoryIdAndDefaultVariantTrue(Long productId);
}
