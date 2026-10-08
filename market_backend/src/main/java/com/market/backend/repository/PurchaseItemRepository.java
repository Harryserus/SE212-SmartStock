package com.market.backend.repository;

import com.market.backend.model.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseItemRepository
        extends JpaRepository<PurchaseItem, Integer> {

}
