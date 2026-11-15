package com.newtin.eco.repository;

import com.newtin.eco.model.VariantItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderCatalogRepository extends JpaRepository<VariantItem, Long> {
    interface VariantOrderDetails {
        Long getVariantItemId();
        Long getProductId();
        Integer getStockQuantity();
        boolean getVariantActive();
        boolean getProductActive();
        String getProductName();
        String getImageUrl();
        java.math.BigDecimal getUnitPrice();
        String getVariantDescription();
    }

    @Query(value = """
            select vi.variant_item_id as variantItemId,
                   p.product_id as productId,
                   vi.stock_quantity as stockQuantity,
                   vi.is_active as variantActive,
                   p.is_active as productActive,
                   p.product_name as productName,
                   (select pi.image_url
                    from product_image pi
                    where pi.variant_item_id = vi.variant_item_id
                    order by pi.is_main desc, pi.display_order, pi.image_id
                    limit 1) as imageUrl,
                   p.base_price + v.price_adjustment as unitPrice,
                   concat_ws(' / ', v.variant_description, vi.additional_description) as variantDescription
            from (
                select cv.variant_item_id, cv.product_id, cv.price_adjustment,
                       'CLOTHING' as product_type,
                       concat_ws(' / ', cv.size, cv.color, c.material) as variant_description
                from clothing_variant cv
                join clothing c on c.product_id = cv.product_id
                union all
                select av.variant_item_id, av.product_id, av.price_adjustment,
                       'ACCESSORY' as product_type,
                       concat_ws(' / ', av.color, av.material) as variant_description
                from accessory_variant av
                union all
                select sv.variant_item_id, sv.product_id, sv.price_adjustment,
                       'SKINCARE' as product_type,
                       concat_ws(' / ', sv.size_label, concat(sv.volume_ml, ' ml'), sv.formulation) as variant_description
                from skincare_variant sv
            ) v
            join variant_item vi on vi.variant_item_id = v.variant_item_id
            join product p on p.product_id = v.product_id
            where vi.variant_item_id in (:variantIds)
              and p.product_type = v.product_type
              and (p.category_id is null or exists (
                  select 1 from category c where c.category_id = p.category_id and c.is_active = true
              ))
            """, nativeQuery = true)
    List<VariantOrderDetails> findOrderDetails(@Param("variantIds") Collection<Long> variantIds);

    @Modifying
    @Query("update VariantItem v set v.stockQuantity = v.stockQuantity - :quantity "
            + "where v.id = :variantId and v.active = true and v.stockQuantity >= :quantity")
    int reserveStock(@Param("variantId") Long variantId, @Param("quantity") int quantity);

    @Modifying
    @Query("update VariantItem v set v.stockQuantity = v.stockQuantity + :quantity where v.id = :variantId")
    int releaseStock(@Param("variantId") Long variantId, @Param("quantity") int quantity);
}
