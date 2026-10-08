package com.market.backend.dto;

public class InventoryResponse {

    private Integer productId;
    private String productName;
    private Integer quantity;
    private Integer reorderLevel;
    private String status;

    public InventoryResponse(
            Integer productId,
            String productName,
            Integer quantity,
            Integer reorderLevel,
            String status) {

        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.reorderLevel = reorderLevel;
        this.status = status;
    }

    public Integer getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public Integer getReorderLevel() {
        return reorderLevel;
    }

    public String getStatus() {
        return status;
    }
}
