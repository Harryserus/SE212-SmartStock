package com.market.backend.dto;

public class PurchaseRecommendationResponse {

    private Integer productId;
    private String productName;
    private Integer currentStock;
    private double averageDailySales;
    private Integer recommendedQuantity;
    private String reason;

    public PurchaseRecommendationResponse(
            Integer productId,
            String productName,
            Integer currentStock,
            double averageDailySales,
            Integer recommendedQuantity,
            String reason) {

        this.productId = productId;
        this.productName = productName;
        this.currentStock = currentStock;
        this.averageDailySales = averageDailySales;
        this.recommendedQuantity = recommendedQuantity;
        this.reason = reason;
    }

    public Integer getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public double getAverageDailySales() {
        return averageDailySales;
    }

    public Integer getRecommendedQuantity() {
        return recommendedQuantity;
    }

    public String getReason() {
        return reason;
    }
}
