package com.market.backend.dto;

import java.math.BigDecimal;

public class ManagementOverviewResponse {

    private BigDecimal todayRevenue;
    private Long todayTransactions;
    private Long lowStockProducts;
    private Long productsToPurchase;

    public ManagementOverviewResponse(
            BigDecimal todayRevenue,
            Long todayTransactions,
            Long lowStockProducts,
            Long productsToPurchase) {

        this.todayRevenue = todayRevenue;
        this.todayTransactions = todayTransactions;
        this.lowStockProducts = lowStockProducts;
        this.productsToPurchase = productsToPurchase;
    }

    public BigDecimal getTodayRevenue() {
        return todayRevenue;
    }

    public Long getTodayTransactions() {
        return todayTransactions;
    }

    public Long getLowStockProducts() {
        return lowStockProducts;
    }

    public Long getProductsToPurchase() {
        return productsToPurchase;
    }
}
