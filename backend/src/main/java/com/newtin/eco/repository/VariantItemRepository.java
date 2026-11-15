package com.newtin.eco.repository;

import com.newtin.eco.model.VariantItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface VariantItemRepository extends JpaRepository<VariantItem, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from VariantItem v where v.id = :id")
    Optional<VariantItem> findByIdForUpdate(@Param("id") Long id);

    @Query(value = """
            select product_id from (
                select product_id, variant_item_id from clothing_variant
                union all select product_id, variant_item_id from accessory_variant
                union all select product_id, variant_item_id from skincare_variant
            ) variants where variant_item_id = :variantId limit 1
            """, nativeQuery = true)
    Optional<Long> findProductId(@Param("variantId") Long variantId);
}
