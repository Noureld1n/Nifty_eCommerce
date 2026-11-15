package com.newtin.eco.repository;

import com.newtin.eco.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByCustomerIdOrderByDefaultAddressDescCreatedAtDescIdDesc(Long customerId);

    Optional<Address> findByIdAndCustomerId(Long id, Long customerId);

    boolean existsByCustomerIdAndDefaultAddressTrue(Long customerId);

    Optional<Address> findFirstByCustomerIdOrderByCreatedAtDescIdDesc(Long customerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Address a set a.defaultAddress = false where a.customer.id = :customerId")
    void clearDefault(@Param("customerId") Long customerId);
}
