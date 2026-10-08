package com.market.backend.dto;

import java.math.BigDecimal;

public class SalesSummaryResponse {

    private BigDecimal todayRevenue;
    private Long todayTransactions;

    public SalesSummaryResponse(
            BigDecimal todayRevenue,
            Long todayTransactions) {

        this.todayRevenue = todayRevenue;
        this.todayTransactions = todayTransactions;
    }

    public BigDecimal getTodayRevenue() {
        return todayRevenue;
    }

    public Long getTodayTransactions() {
        return todayTransactions;
    }
}
