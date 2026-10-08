package com.market.backend.service;

import com.market.backend.dto.ProductRequest;
import com.market.backend.model.Category;
import com.market.backend.model.Product;
import com.market.backend.repository.CategoryRepository;
import com.market.backend.repository.ProductRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository) {

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(int id) {
        return productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Product not found: " + id));
    }

    public Product createProduct(ProductRequest request) {

        // Validate values
        validateProductRequest(request);

        // Find category
        Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found: "
                                + request.getCategoryId()));

        // Create product
        Product product = new Product();

        product.setCategory(category);
        product.setProductName(request.getProductName());
        product.setSellingPrice(request.getSellingPrice());
        product.setCostPrice(request.getCostPrice());
        product.setReorderLevel(request.getReorderLevel());

        return productRepository.save(product);
    }

    public Product updateProduct(
            int id,
            ProductRequest request) {

        // Validate values
        validateProductRequest(request);

        // Find existing product
        Product product = getProductById(id);

        // Find category
        Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found: "
                                + request.getCategoryId()));

        // Update product
        product.setCategory(category);
        product.setProductName(request.getProductName());
        product.setSellingPrice(request.getSellingPrice());
        product.setCostPrice(request.getCostPrice());
        product.setReorderLevel(request.getReorderLevel());

        return productRepository.save(product);
    }

    public void deleteProduct(int id) {

        if (!productRepository.existsById(id)) {
            throw new RuntimeException(
                    "Product not found: " + id);
        }

        productRepository.deleteById(id);
    }

    private void validateProductRequest(ProductRequest request) {

        if (request.getSellingPrice() == null ||
                request.getSellingPrice().signum() < 0) {

            throw new RuntimeException(
                    "Selling price cannot be negative");
        }

        if (request.getCostPrice() == null ||
                request.getCostPrice().signum() < 0) {

            throw new RuntimeException(
                    "Cost price cannot be negative");
        }

        if (request.getReorderLevel() == null ||
                request.getReorderLevel() < 0) {

            throw new RuntimeException(
                    "Reorder level cannot be negative");
        }
    }
}
