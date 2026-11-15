package com.newtin.eco.repository;

import com.newtin.eco.enums.PaymentProvider;
import com.newtin.eco.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    @Query("select p from PaymentMethod p where p.customer.id = :cid and p.active = true "
            + "order by p.defaultMethod desc, p.createdAt desc, p.id desc")
    List<PaymentMethod> findActiveByCustomer(@Param("cid") Long customerId);

    long countByCustomerIdAndActiveTrue(Long customerId);

    // ownership is part of the lookup, so another customer's id simply looks like "not found"
    Optional<PaymentMethod> findByIdAndCustomerIdAndActiveTrue(Long id, Long customerId);

    Optional<PaymentMethod> findByProviderAndProviderToken(PaymentProvider provider, String providerToken);

    Optional<PaymentMethod> findFirstByCustomerIdAndActiveTrueOrderByCreatedAtDescIdDesc(Long customerId);

    // Bulk updates run immediately and in call order. Switching the default is always clear THEN mark,
    // because the unique generated column is checked per statement.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update PaymentMethod p set p.defaultMethod = false where p.customer.id = :cid and p.defaultMethod = true")
    int clearDefault(@Param("cid") Long customerId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update PaymentMethod p set p.defaultMethod = true where p.id = :id and p.active = true")
    int markDefault(@Param("id") Long id);
}