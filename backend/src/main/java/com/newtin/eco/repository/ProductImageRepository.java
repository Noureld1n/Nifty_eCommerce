package com.newtin.eco.repository;

import com.newtin.eco.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    interface ProductPrimaryImage {
        Long getProductId();
        String getImageUrl();
    }

    List<ProductImage> findByVariantItemIdOrderByDisplayOrderAscIdAsc(Long variantItemId);
    Optional<ProductImage> findByIdAndVariantItemId(Long id, Long variantItemId);
    boolean existsByVariantItemIdAndMainTrue(Long variantItemId);

    @Query(value = """
            select ranked.product_id as productId, ranked.image_url as imageUrl
            from (
                select p.product_id, pi.image_url,
                       row_number() over (
                           partition by p.product_id
                           order by v.is_default desc, pi.is_main desc,
                                    pi.display_order, pi.image_id, v.variant_item_id
                       ) as image_rank
                from product p
                join (
                    select cv.product_id, cv.variant_item_id, cv.is_default
                    from clothing_variant cv
                    join variant_item vi on vi.variant_item_id = cv.variant_item_id
                    where vi.is_active = true
                    union all
                    select av.product_id, av.variant_item_id, av.is_default
                    from accessory_variant av
                    join variant_item vi on vi.variant_item_id = av.variant_item_id
                    where vi.is_active = true
                    union all
                    select sv.product_id, sv.variant_item_id, sv.is_default
                    from skincare_variant sv
                    join variant_item vi on vi.variant_item_id = sv.variant_item_id
                    where vi.is_active = true
                ) v on v.product_id = p.product_id
                join product_image pi on pi.variant_item_id = v.variant_item_id
                where p.product_id in (:productIds)
            ) ranked
            where ranked.image_rank = 1
            """, nativeQuery = true)
    List<ProductPrimaryImage> findPrimaryImagesByProductIds(@Param("productIds") List<Long> productIds);

    @Modifying(flushAutomatically = true)
    @Query("update ProductImage i set i.main = false where i.variantItem.id = :variantId")
    void clearMain(@Param("variantId") Long variantId);
}
