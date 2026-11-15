package com.newtin.eco.repository;

import com.newtin.eco.model.Clothing;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClothingRepository extends JpaRepository<Clothing, Long> {}
