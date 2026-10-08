package com.market.backend.controller;

import com.market.backend.service.ManagementService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/management")
@CrossOrigin(origins = "*")
public class ManagementController {

    private final ManagementService managementService;

    public ManagementController(
            ManagementService managementService) {

        this.managementService = managementService;
    }

    // GET /api/management/overview
    @GetMapping("/overview")
    public ResponseEntity<?> getOverview() {

        return ResponseEntity.ok(
                managementService.getOverview()
        );
    }

    // GET /api/management/recommendations
    @GetMapping("/recommendations")
    public ResponseEntity<?> getPurchaseRecommendations() {

        return ResponseEntity.ok(
                managementService.getPurchaseRecommendations()
        );
    }

    // GET /api/management/top-products
    @GetMapping("/top-products")
    public ResponseEntity<?> getTopProducts() {

        return ResponseEntity.ok(
                managementService.getTopProducts()
        );
    }

    // GET /api/management/slow-products
    @GetMapping("/slow-products")
    public ResponseEntity<?> getSlowProducts() {

        return ResponseEntity.ok(
                managementService.getSlowProducts()
        );
    }
}
