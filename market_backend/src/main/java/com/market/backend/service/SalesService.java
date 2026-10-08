package com.market.backend.service;

import com.market.backend.dto.ProductSalesResponse;
import com.market.backend.dto.SaleItemRequest;
import com.market.backend.dto.SaleRequest;
import com.market.backend.dto.SalesSummaryResponse;

import com.market.backend.model.Inventory;
import com.market.backend.model.Product;
import com.market.backend.model.Sale;
import com.market.backend.model.SaleItem;

import com.market.backend.repository.InventoryRepository;
import com.market.backend.repository.ProductRepository;
import com.market.backend.repository.SaleItemRepository;
import com.market.backend.repository.SaleRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SalesService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public SalesService(
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository) {

        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    public Sale getSaleById(int id) {

        return saleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Sale not found: " + id));
    }

    @Transactional
    public Sale createSale(SaleRequest request) {

        if (request.getItems() == null ||
                request.getItems().isEmpty()) {

            throw new RuntimeException(
                    "Sale must contain at least one item");
        }

        Sale sale = new Sale();

        BigDecimal total =
                BigDecimal.ZERO;

        List<SaleItem> saleItems =
                new ArrayList<>();

        for (SaleItemRequest itemRequest :
                request.getItems()) {

            Product product =
                    productRepository
                            .findById(
                                    itemRequest.getProductId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Product not found: "
                                            + itemRequest
                                                    .getProductId()));

            int quantity =
                    itemRequest.getQuantity();

            if (quantity <= 0) {
                throw new RuntimeException(
                        "Quantity must be greater than 0");
            }

            Inventory inventory =
                    inventoryRepository
                            .findByProductProductId(
                                    product.getProductId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Inventory not found for product: "
                                            + product
                                                    .getProductName()));

            if (inventory.getQuantity() < quantity) {

                throw new RuntimeException(
                        "Not enough stock for: "
                        + product.getProductName()
                        + ". Available: "
                        + inventory.getQuantity()
                );
            }

            BigDecimal subtotal =
                    product.getSellingPrice()
                            .multiply(
                                    BigDecimal.valueOf(quantity)
                            );

            SaleItem saleItem =
                    new SaleItem();

            saleItem.setSale(sale);
            saleItem.setProduct(product);
            saleItem.setQuantity(quantity);

            // Price comes from database
            saleItem.setUnitPrice(
                    product.getSellingPrice()
            );

            saleItem.setSubtotal(subtotal);

            saleItems.add(saleItem);

            total = total.add(subtotal);

            // Decrease inventory
            inventory.setQuantity(
                    inventory.getQuantity() - quantity
            );

            inventoryRepository.save(inventory);
        }

        sale.setTotalAmount(total);
        sale.setItems(saleItems);

        return saleRepository.save(sale);
    }

    public List<ProductSalesResponse> getTopSellingProducts(
            int limit) {

        List<ProductSalesResponse> products =
                saleItemRepository
                        .findTopSellingProducts();

        return limitResults(products, limit);
    }

    public List<ProductSalesResponse> getLeastSellingProducts(
            int limit) {

        List<ProductSalesResponse> products =
                saleItemRepository
                        .findLeastSellingProducts();

        return limitResults(products, limit);
    }

    public SalesSummaryResponse getSalesSummary() {

        LocalDate today = LocalDate.now();

        LocalDateTime start =
                today.atStartOfDay();

        LocalDateTime end =
                today.plusDays(1)
                        .atStartOfDay();

        BigDecimal revenue =
                saleRepository
                        .getRevenueBetween(start, end);

        long transactions =
                saleRepository
                        .countBySaleDateBetween(
                                start,
                                end
                        );

        return new SalesSummaryResponse(
                revenue,
                transactions
        );
    }

    private List<ProductSalesResponse> limitResults(
            List<ProductSalesResponse> products,
            int limit) {

        if (limit <= 0) {
            return new ArrayList<>();
        }

        if (products.size() <= limit) {
            return products;
        }

        return products.subList(0, limit);
    }
}
