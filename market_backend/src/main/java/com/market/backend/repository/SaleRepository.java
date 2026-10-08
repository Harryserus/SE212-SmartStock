package com.market.backend.repository;

import com.market.backend.model.Sale;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface SaleRepository
        extends JpaRepository<Sale, Integer> {

    long countBySaleDateBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("""
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM Sale s
        WHERE s.saleDate BETWEEN :start AND :end
    """)
    BigDecimal getRevenueBetween(
            LocalDateTime start,
            LocalDateTime end
    );
}
