package com.newtin.eco.repository;

import com.newtin.eco.model.ProcurementPackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcurementPackageRepository extends JpaRepository<ProcurementPackage, Long> {
    @EntityGraph(attributePaths = {"provider", "accountable"})
    Page<ProcurementPackage> findAllByOrderByPurchaseDateDescIdDesc(Pageable pageable);
}
