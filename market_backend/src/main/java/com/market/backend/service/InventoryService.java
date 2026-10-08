package com.market.backend.service;

import com.market.backend.dto.InventoryResponse;
import com.market.backend.model.Inventory;
import com.market.backend.model.Product;
import com.market.backend.repository.InventoryRepository;
import com.market.backend.repository.ProductRepository;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository) {

        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
    }

    public List<InventoryResponse> getCurrentInventory() {

        List<Inventory> inventoryList =
                inventoryRepository.findAll();

        List<InventoryResponse> response =
                new ArrayList<>();

        for (Inventory inventory : inventoryList) {

            Product product = inventory.getProduct();

            response.add(
                    createResponse(inventory, product)
            );
        }

        return response;
    }

    public InventoryResponse getProductInventory(
            int productId) {

        Inventory inventory =
                inventoryRepository
                        .findByProductProductId(productId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Inventory not found for product: "
                                        + productId));

        return createResponse(
                inventory,
                inventory.getProduct()
        );
    }

    public List<InventoryResponse> getLowStockProducts() {

        List<Inventory> inventoryList =
                inventoryRepository.findAll();

        List<InventoryResponse> response =
                new ArrayList<>();

        for (Inventory inventory : inventoryList) {

            Product product = inventory.getProduct();

            if (inventory.getQuantity()
                    <= product.getReorderLevel()) {

                response.add(
                        new InventoryResponse(
                                product.getProductId(),
                                product.getProductName(),
                                inventory.getQuantity(),
                                product.getReorderLevel(),
                                "LOW_STOCK"
                        )
                );
            }
        }

        return response;
    }

    public InventoryResponse addStock(
            int productId,
            int quantity) {

        if (quantity <= 0) {
            throw new RuntimeException(
                    "Quantity must be greater than 0");
        }

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product not found: "
                                        + productId));

        Inventory inventory =
                inventoryRepository
                        .findByProductProductId(productId)
                        .orElseGet(() -> {

                            Inventory newInventory =
                                    new Inventory();

                            newInventory.setProduct(product);
                            newInventory.setQuantity(0);

                            return newInventory;
                        });

        inventory.setQuantity(
                inventory.getQuantity() + quantity
        );

        inventoryRepository.save(inventory);

        return createResponse(inventory, product);
    }

    public InventoryResponse adjustStock(
            int productId,
            int quantity) {

        if (quantity < 0) {
            throw new RuntimeException(
                    "Quantity cannot be negative");
        }

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product not found: "
                                        + productId));

        Inventory inventory =
                inventoryRepository
                        .findByProductProductId(productId)
                        .orElseGet(() -> {

                            Inventory newInventory =
                                    new Inventory();

                            newInventory.setProduct(product);
                            return newInventory;
                        });

        inventory.setQuantity(quantity);

        inventoryRepository.save(inventory);

        return createResponse(inventory, product);
    }

    private InventoryResponse createResponse(
            Inventory inventory,
            Product product) {

        String status;

        if (inventory.getQuantity()
                <= product.getReorderLevel()) {

            status = "LOW_STOCK";

        } else {

            status = "OK";
        }

        return new InventoryResponse(
                product.getProductId(),
                product.getProductName(),
                inventory.getQuantity(),
                product.getReorderLevel(),
                status
        );
    }
}
