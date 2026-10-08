package com.market.backend.dto;

public class ProductSalesResponse {

    private Integer productId;
    private String productName;
    private Long quantitySold;

    public ProductSalesResponse(
            Integer productId,
            String productName,
            Long quantitySold) {

        this.productId = productId;
        this.productName = productName;
        this.quantitySold = quantitySold;
    }

    public Integer getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Long getQuantitySold() {
        return quantitySold;
    }
}
