package com.market.backend.dto;

import java.util.List;

public class SaleRequest {

    private List<SaleItemRequest> items;

    public List<SaleItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SaleItemRequest> items) {
        this.items = items;
    }
}
