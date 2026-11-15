package com.newtin.eco.repository;

import com.newtin.eco.model.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    @Query(value = "select distinct p from Promotion p "
            + "where p.active = true and p.startDate <= :now and p.endDate > :now "
            + "order by p.startDate desc, p.id desc",
            countQuery = "select count(p) from Promotion p "
                    + "where p.active = true and p.startDate <= :now and p.endDate > :now")
    Page<Promotion> findCurrent(@Param("now") LocalDateTime now, Pageable pageable);

    @Query("select distinct p from Promotion p order by p.createdAt desc, p.id desc")
    Page<Promotion> findAllWithTargets(Pageable pageable);

    @Query("select p from Promotion p where p.id = :id")
    Optional<Promotion> findWithTargets(@Param("id") Long id);

    @Query(value = """
            with recursive selected_products(product_id) as (
                select p.product_id
                from product p
                where p.product_id in (:productIds)
            ),
            product_categories(product_id, category_id) as (
                select p.product_id, p.category_id
                from product p
                where p.product_id in (:productIds) and p.category_id is not null
                union all
                select pc.product_id, c.parent_category_id
                from product_categories pc
                join category c on c.category_id = pc.category_id
                where c.parent_category_id is not null
            )
            select distinct pr.promotion_id as promotionId,
                   pr.promo_name as promotionName,
                   pr.discount_type as discountType,
                   pr.discount_value as discountValue,
                   sp.product_id as productId
            from promotion pr
            join selected_products sp
            where pr.is_active = true
              and pr.start_date <= :now
              and pr.end_date > :now
              and (
                  exists (select 1 from promotion_product pp
                          where pp.promotion_id = pr.promotion_id and pp.product_id = sp.product_id)
                  or exists (select 1 from promotion_category pcat
                             join product_categories pc on pc.category_id = pcat.category_id
                             where pcat.promotion_id = pr.promotion_id and pc.product_id = sp.product_id)
                  or (
                      not exists (select 1 from promotion_product x where x.promotion_id = pr.promotion_id)
                      and not exists (select 1 from promotion_category x where x.promotion_id = pr.promotion_id)
                  )
              )
            """, nativeQuery = true)
    List<ApplicablePromotion> findApplicable(@Param("productIds") Collection<Long> productIds,
                                             @Param("now") LocalDateTime now);

    interface ApplicablePromotion {
        Long getPromotionId();
        String getPromotionName();
        String getDiscountType();
        java.math.BigDecimal getDiscountValue();
        Long getProductId();
    }
}
