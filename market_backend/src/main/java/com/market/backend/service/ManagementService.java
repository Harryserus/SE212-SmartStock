package com.market.backend.service;

import com.market.backend.dto.InventoryResponse;
import com.market.backend.dto.ManagementOverviewResponse;
import com.market.backend.dto.ProductSalesResponse;
import com.market.backend.dto.PurchaseRecommendationResponse;

import com.market.backend.model.Inventory;
import com.market.backend.model.Product;

import com.market.backend.repository.InventoryRepository;
import com.market.backend.repository.ProductRepository;
import com.market.backend.repository.SaleItemRepository;
import com.market.backend.repository.SaleRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ManagementService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final InventoryService inventoryService;

    public ManagementService(
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            InventoryService inventoryService) {

        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.inventoryService = inventoryService;
    }

    public ManagementOverviewResponse getOverview() {

        LocalDate today = LocalDate.now();

        LocalDateTime start =
                today.atStartOfDay();

        LocalDateTime end =
                today.plusDays(1)
                        .atStartOfDay();

        BigDecimal revenue =
                saleRepository
                        .getRevenueBetween(
                                start,
                                end
                        );

        long transactions =
                saleRepository
                        .countBySaleDateBetween(
                                start,
                                end
                        );

        long lowStockProducts =
                inventoryService
                        .getLowStockProducts()
                        .size();

        long productsToPurchase =
                getPurchaseRecommendations()
                        .size();

        return new ManagementOverviewResponse(
                revenue,
                transactions,
                lowStockProducts,
                productsToPurchase
        );
    }

    public List<PurchaseRecommendationResponse>
    getPurchaseRecommendations() {

        List<Product> products =
                productRepository.findAll();

        List<PurchaseRecommendationResponse>
                recommendations =
                new ArrayList<>();

        LocalDate endDate =
                LocalDate.now();

        LocalDate startDate =
                endDate.minusDays(30);

        LocalDateTime start =
                startDate.atStartOfDay();

        LocalDateTime end =
                endDate.plusDays(1)
                        .atStartOfDay();

        for (Product product : products) {

            Inventory inventory =
                    inventoryRepository
                            .findByProductProductId(
                                    product.getProductId()
                            )
                            .orElse(null);

            if (inventory == null) {
                continue;
            }

            Long quantitySold =
                    saleItemRepository
                            .getQuantitySoldForProduct(
                                    product.getProductId(),
                                    start,
                                    end
                            );

            if (quantitySold == null) {
                quantitySold = 0L;
            }

            double averageDailySales =
                    quantitySold / 30.0;

            int currentStock =
                    inventory.getQuantity();

            int reorderLevel =
                    product.getReorderLevel();

            if (currentStock <= reorderLevel) {

                int targetStock =
                        Math.max(
                                reorderLevel * 2,
                                (int) Math.ceil(
                                        averageDailySales * 7
                                )
                        );

                int recommendedQuantity =
                        Math.max(
                                0,
                                targetStock - currentStock
                        );

                recommendations.add(
                        new PurchaseRecommendationResponse(
                                product.getProductId(),
                                product.getProductName(),
                                currentStock,
                                averageDailySales,
                                recommendedQuantity,
                                "LOW_STOCK"
                        )
                );
            }
        }

        return recommendations;
    }

    public List<ProductSalesResponse>
    getTopProducts() {

        return saleItemRepository
                .findTopSellingProducts()
                .stream()
                .limit(5)
                .toList();
    }

    public List<ProductSalesResponse>
    getSlowProducts() {

        return saleItemRepository
                .findLeastSellingProducts()
                .stream()
                .limit(5)
                .toList();
    }
}
