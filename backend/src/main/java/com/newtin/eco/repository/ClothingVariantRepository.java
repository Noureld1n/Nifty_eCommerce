package com.newtin.eco.repository;

import com.newtin.eco.model.ClothingVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClothingVariantRepository extends JpaRepository<ClothingVariant, Long> {
    List<ClothingVariant> findByClothingIdOrderByDefaultVariantDescIdAsc(Long productId);
    Optional<ClothingVariant> findByIdAndClothingId(Long id, Long productId);
    Optional<ClothingVariant> findByVariantItemId(Long variantItemId);
    boolean existsByClothingIdAndDefaultVariantTrue(Long productId);
}
