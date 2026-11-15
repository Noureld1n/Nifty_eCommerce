package com.newtin.eco.repository;

import com.newtin.eco.model.Accountable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountableRepository extends JpaRepository<Accountable, Long> {
    List<Accountable> findByActiveTrueOrderByNameAsc();
    List<Accountable> findByActiveOrderByNameAsc(boolean active);
}
