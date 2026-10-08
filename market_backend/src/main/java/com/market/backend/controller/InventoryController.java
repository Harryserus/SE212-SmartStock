package com.market.backend.controller;

import com.market.backend.dto.InventoryResponse;
import com.market.backend.service.InventoryService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(
            InventoryService inventoryService) {

        this.inventoryService = inventoryService;
    }

    // GET /api/inventory
    @GetMapping
    public ResponseEntity<List<InventoryResponse>>
    getCurrentInventory() {

        return ResponseEntity.ok(
                inventoryService.getCurrentInventory()
        );
    }

    // GET /api/inventory/low-stock
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>>
    getLowStockProducts() {

        return ResponseEntity.ok(
                inventoryService.getLowStockProducts()
        );
    }

    // GET /api/inventory/{productId}
    @GetMapping("/{productId}")
    public ResponseEntity<InventoryResponse>
    getProductInventory(
            @PathVariable int productId) {

        return ResponseEntity.ok(
                inventoryService.getProductInventory(productId)
        );
    }

    // POST /api/inventory/stock-in
    @PostMapping("/stock-in")
    public ResponseEntity<InventoryResponse>
    addStock(
            @RequestParam int productId,
            @RequestParam int quantity) {

        return ResponseEntity.ok(
                inventoryService.addStock(
                        productId,
                        quantity
                )
        );
    }

    // POST /api/inventory/adjust
    @PostMapping("/adjust")
    public ResponseEntity<InventoryResponse>
    adjustStock(
            @RequestParam int productId,
            @RequestParam int quantity) {

        return ResponseEntity.ok(
                inventoryService.adjustStock(
                        productId,
                        quantity
                )
        );
    }
}