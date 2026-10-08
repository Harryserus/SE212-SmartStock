package com.market.backend.controller;

import com.market.backend.dto.SaleRequest;
import com.market.backend.model.Sale;
import com.market.backend.service.SalesService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*")
public class SalesController {

    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    // GET /api/sales
    @GetMapping
    public ResponseEntity<List<Sale>> getAllSales() {

        return ResponseEntity.ok(
                salesService.getAllSales()
        );
    }

    // GET /api/sales/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Sale> getSaleById(
            @PathVariable int id) {

        return ResponseEntity.ok(
                salesService.getSaleById(id)
        );
    }

    // POST /api/sales
    @PostMapping
    public ResponseEntity<Sale> createSale(
            @RequestBody SaleRequest request) {

        Sale sale = salesService.createSale(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(sale);
    }

    // GET /api/sales/top
    @GetMapping("/top")
    public ResponseEntity<?> getTopSellingProducts(
            @RequestParam(defaultValue = "10") int limit) {

        return ResponseEntity.ok(
                salesService.getTopSellingProducts(limit)
        );
    }

    // GET /api/sales/least
    @GetMapping("/least")
    public ResponseEntity<?> getLeastSellingProducts(
            @RequestParam(defaultValue = "10") int limit) {

        return ResponseEntity.ok(
                salesService.getLeastSellingProducts(limit)
        );
    }

    // GET /api/sales/summary
    @GetMapping("/summary")
    public ResponseEntity<?> getSalesSummary() {

        return ResponseEntity.ok(
                salesService.getSalesSummary()
        );
    }
}
