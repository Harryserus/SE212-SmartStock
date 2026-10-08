package com.market.backend.repository;

import com.market.backend.model.SaleItem;
import com.market.backend.dto.ProductSalesResponse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Integer> {

    @Query("""
        SELECT new com.market.backend.dto.ProductSalesResponse(
            p.productId,
            p.productName,
            SUM(si.quantity)
        )
        FROM SaleItem si
        JOIN si.product p
        GROUP BY p.productId, p.productName
        ORDER BY SUM(si.quantity) DESC
    """)
    List<ProductSalesResponse> findTopSellingProducts();

    @Query("""
        SELECT new com.market.backend.dto.ProductSalesResponse(
            p.productId,
            p.productName,
            SUM(si.quantity)
        )
        FROM SaleItem si
        JOIN si.product p
        GROUP BY p.productId, p.productName
        ORDER BY SUM(si.quantity) ASC
    """)
    List<ProductSalesResponse> findLeastSellingProducts();

    @Query("""
        SELECT COALESCE(SUM(si.quantity), 0)
        FROM SaleItem si
        WHERE si.product.productId = :productId
        AND si.sale.saleDate BETWEEN :start AND :end
    """)
    Long getQuantitySoldForProduct(
            Integer productId,
            LocalDateTime start,
            LocalDateTime end
    );
}
