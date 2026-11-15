package com.newtin.eco.repository;

import com.newtin.eco.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueOrderByNameAsc();
    boolean existsByNameAndParentId(String name, Long parentId);
    boolean existsByParentIdAndActiveTrue(Long parentId);
}
