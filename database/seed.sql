-- ============================================================
-- SmartStock sample data (normalized 3NF schema)
-- ============================================================

USE se212_smartstock;

-- Clear existing data (children first)
DELETE FROM sale_item;
DELETE FROM sale;
DELETE FROM supplier_issue;
DELETE FROM purchase_order_item;
DELETE FROM purchase_order;
DELETE FROM product_supplier;
DELETE FROM inventory;
DELETE FROM product;
DELETE FROM category;
DELETE FROM supplier;
DELETE FROM employee;

-- ========== CATEGORIES ==========
INSERT INTO category (category_id, category_name, description) VALUES
(1, 'Dairy',       'Milk, cheese, yogurt and other dairy products'),
(2, 'Bakery',      'Bread, pastries, cakes'),
(3, 'Hardware',    'Tools, fasteners, small parts'),
(4, 'Electronics', 'Small electronic goods'),
(5, 'Beverages',   'Soft drinks, juices, water');

-- ========== EMPLOYEES ==========
INSERT INTO employee (employee_id, employee_name, role, phone, hire_date) VALUES
(1, 'Somchai Jaidee',  'Cashier', '081-111-1111', '2023-01-15'),
(2, 'Malee Wongsa',    'Cashier', '081-222-2222', '2023-03-20'),
(3, 'Pree Theing',     'Manager', '081-333-3333', '2021-06-01'),
(4, 'Aree Chaiyo',     'Stock',   '081-444-4444', '2022-09-10');

-- ========== SUPPLIERS ==========
INSERT INTO supplier (supplier_id, supplier_name, contact_name, phone, email) VALUES
(5, 'FreshFarm Co.',   'Alice',  '02-555-0001', 'sales@freshfarm.co'),
(6, 'BakeryPlus',      'Bob',    '02-555-0002', 'orders@bakeryplus.co'),
(7, 'HardwareHub',     'Carol',  '02-555-0003', 'info@hardwarehub.co'),
(8, 'ElectroMart',     'David',  '02-555-0004', 'contact@electromart.co');

-- ========== PRODUCTS ==========
INSERT INTO product (product_id, product_name, unit_price, barcode, category_id) VALUES
(101, 'Widget',    9.99,  '890000000101', 3),
(102, 'Gizmo',    19.99,  '890000000102', 4),
(103, 'Doohickey', 4.50,  '890000000103', 3),
(104, 'Milk 1L',   1.50,  '890000000104', 1),
(105, 'Bread',     2.20,  '890000000105', 2),
(106, 'Cola 500ml',1.25,  '890000000106', 5),
(107, 'Cheese',    6.80,  '890000000107', 1);

-- ========== INVENTORY ==========
INSERT INTO inventory (product_id, quantity_in_stock, reorder_level, last_updated) VALUES
(101, 40,  20, '2026-09-28 09:00:00'),
(102, 3,  10, '2026-09-28 09:00:00'),
(103, 200, 50, '2026-09-28 09:00:00'),
(104, 60,  30, '2026-09-30 07:30:00'),
(105, 25,  15, '2026-09-30 07:30:00'),
(106, 100, 40, '2026-09-29 18:00:00'),
(107, 8,  10, '2026-09-29 18:00:00');

-- ========== PRODUCT_SUPPLIER ==========
INSERT INTO product_supplier (product_id, supplier_id, supply_price, supplier_product_code, lead_time_days) VALUES
(101, 7, 6.00,  'HW-WIDGET',  3),
(102, 8, 12.50, 'EM-GIZMO',   5),
(103, 7, 2.20,  'HW-DOO',     3),
(104, 5, 0.80,  'FF-MILK',    2),
(105, 6, 1.10,  'BP-BREAD',   2),
(106, 5, 0.70,  'FF-COLA',    2),
(107, 5, 4.50,  'FF-CHEESE',  2);

-- ========== PURCHASE_ORDERS ==========
INSERT INTO purchase_order
(purchase_order_id, order_date, expected_delivery_date, status, supplier_id, employee_id) VALUES
(9001, '2026-09-20', '2026-09-23', 'received', 5, 4),
(9002, '2026-09-25', '2026-09-28', 'received', 7, 4),
(9003, '2026-09-29', '2026-10-02', 'pending',  8, 4);

-- ========== PURCHASE_ORDER_ITEMS ==========
INSERT INTO purchase_order_item
(purchase_order_id, product_id, quantity_ordered, quantity_received, purchase_unit_price) VALUES
(9001, 104, 100, 100, 0.80),
(9001, 107,  20,  20, 4.50),
(9002, 101,  50,  50, 6.00),
(9002, 103, 200, 200, 2.20),
(9003, 102,  30,   0, 12.50);

-- ========== SUPPLIER_ISSUES ==========
INSERT INTO supplier_issue
(issue_id, issue_type, description, status, issue_date, resolved_date,
 purchase_order_id, employee_id) VALUES
(1, 'Late delivery', 'PO 9001 arrived 1 day late',        'resolved', '2026-09-24', '2026-09-25', 9001, 3),
(2, 'Damaged goods', '3 cheese packs crushed in PO 9001', 'open',     '2026-09-24', NULL,         9001, 4);

-- ========== SALES ==========
INSERT INTO sale (sale_id, sale_date_time, payment_method, employee_id) VALUES
(1001, '2026-09-30 10:15:00', 'cash', 1),
(1002, '2026-09-30 10:42:00', 'card', 1),
(1003, '2026-09-30 11:03:00', 'cash', 2);

-- ========== SALE_ITEMS ==========
INSERT INTO sale_item
(sale_id, product_id, quantity, sale_unit_price, discount_amount) VALUES
(1001, 101, 2,  9.99, 0),
(1001, 102, 1, 19.99, 0),
(1002, 103, 5,  4.50, 0),
(1003, 101, 2,  9.99, 0);




