package com.newtin.eco.repository;

import com.newtin.eco.model.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    List<Provider> findByActiveTrueOrderByNameAsc();
    List<Provider> findByActiveOrderByNameAsc(boolean active);
}
