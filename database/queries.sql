-- ============================================================
-- SmartStock — Business Queries and Reports
-- File: database/queries.sql
-- Purpose: >= 10 SQL queries with results for the SmartStock project
-- Milestone: M5 (Queries and reports)
-- ============================================================

USE se212_smartstock;


-- ============================================================
-- THE THREE BUSINESS GOALS
-- ============================================================

-- ------------------------------------------------------------
-- GOAL 1: Identify low-stock products (Objective O2)
-- ------------------------------------------------------------
-- Q1: Products below reorder level
SELECT p.product_id,
       p.product_name,
       c.category_name,
       i.quantity_in_stock,
       i.reorder_level,
       (i.reorder_level - i.quantity_in_stock) AS units_needed
FROM inventory i
JOIN product p  ON i.product_id  = p.product_id
JOIN category c ON p.category_id = c.category_id
WHERE i.quantity_in_stock < i.reorder_level
ORDER BY units_needed DESC;

-- Q2: Inventory value summary
SELECT SUM(i.quantity_in_stock * p.unit_price) AS total_inventory_value,
       COUNT(*) AS total_products_tracked
FROM inventory i
JOIN product p ON i.product_id = p.product_id;


-- ------------------------------------------------------------
-- GOAL 2: Best-selling and slow-moving product reports (Objective O4)
-- ------------------------------------------------------------
-- Q3: Top 5 best-selling products
SELECT p.product_id,
       p.product_name,
       SUM(si.quantity) AS units_sold,
       SUM(si.quantity * si.sale_unit_price) AS revenue
FROM sale_item si
JOIN product p ON si.product_id = p.product_id
GROUP BY p.product_id, p.product_name
ORDER BY units_sold DESC
LIMIT 5;

-- Q4: Top 5 slow-moving products
SELECT p.product_id,
       p.product_name,
       COALESCE(SUM(si.quantity), 0) AS units_sold
FROM product p
LEFT JOIN sale_item si ON p.product_id = si.product_id
GROUP BY p.product_id, p.product_name
ORDER BY units_sold ASC
LIMIT 5;

-- Q5: Revenue per sale
SELECT s.sale_id,
       s.sale_date_time,
       e.employee_name,
       SUM(si.quantity * si.sale_unit_price) AS sale_total
FROM sale s
JOIN sale_item si ON s.sale_id = si.sale_id
JOIN employee e   ON s.employee_id = e.employee_id
GROUP BY s.sale_id, s.sale_date_time, e.employee_name
ORDER BY s.sale_date_time DESC;


-- ------------------------------------------------------------
-- GOAL 3: Track supplier delivery issues (Objective O5)
-- ------------------------------------------------------------
-- Q6: Open supplier issues
SELECT s.supplier_id,
       s.supplier_name,
       i.issue_type,
       i.description,
       i.issue_date,
       i.status
FROM supplier_issue i
JOIN purchase_order po ON i.purchase_order_id = po.purchase_order_id
JOIN supplier s        ON po.supplier_id = s.supplier_id
WHERE i.status = 'open'
ORDER BY i.issue_date DESC;

-- Q7: All supplier issues with resolution time
SELECT i.issue_id,
       s.supplier_name,
       i.issue_type,
       i.issue_date,
       i.resolved_date,
       DATEDIFF(i.resolved_date, i.issue_date) AS days_to_resolve
FROM supplier_issue i
JOIN purchase_order po ON i.purchase_order_id = po.purchase_order_id
JOIN supplier s        ON po.supplier_id = s.supplier_id
ORDER BY i.issue_date DESC;


-- ============================================================
-- SUPPORTING QUERIES (for additional reports)
-- ============================================================

-- Q8: Sales by employee
SELECT e.employee_id,
       e.employee_name,
       COUNT(DISTINCT s.sale_id) AS total_sales,
       SUM(si.quantity * si.sale_unit_price) AS total_revenue
FROM employee e
JOIN sale s      ON e.employee_id = s.employee_id
JOIN sale_item si ON s.sale_id = si.sale_id
GROUP BY e.employee_id, e.employee_name
ORDER BY total_revenue DESC;

-- Q9: Purchase orders by supplier
SELECT s.supplier_id,
       s.supplier_name,
       COUNT(po.purchase_order_id) AS po_count,
       SUM(poi.quantity_ordered * poi.purchase_unit_price) AS total_ordered_value
FROM supplier s
JOIN purchase_order po      ON s.supplier_id = po.supplier_id
JOIN purchase_order_item poi ON po.purchase_order_id = poi.purchase_order_id
GROUP BY s.supplier_id, s.supplier_name
ORDER BY total_ordered_value DESC;

-- Q10: Purchase order fulfillment (ordered vs received)
SELECT po.purchase_order_id,
       po.order_date,
       po.status,
       SUM(poi.quantity_ordered) AS total_ordered,
       SUM(poi.quantity_received) AS total_received,
       (SUM(poi.quantity_ordered) - SUM(poi.quantity_received)) AS missing_units
FROM purchase_order po
JOIN purchase_order_item poi ON po.purchase_order_id = poi.purchase_order_id
GROUP BY po.purchase_order_id, po.order_date, po.status
ORDER BY po.order_date DESC;

-- Q11: Products per category
SELECT c.category_id,
       c.category_name,
       COUNT(p.product_id) AS product_count,
       AVG(p.unit_price) AS avg_price
FROM category c
LEFT JOIN product p ON c.category_id = p.category_id
GROUP BY c.category_id, c.category_name
ORDER BY product_count DESC;

-- Q12: Product-supplier comparison (which supplier offers lowest price)
SELECT p.product_id,
       p.product_name,
       s.supplier_name,
       ps.supply_price,
       ps.lead_time_days
FROM product_supplier ps
JOIN product p  ON ps.product_id  = p.product_id
JOIN supplier s ON ps.supplier_id = s.supplier_id
ORDER BY p.product_id, ps.supply_price ASC;