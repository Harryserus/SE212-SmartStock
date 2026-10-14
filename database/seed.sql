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
(1, 'Produce',         'Fresh fruit and vegetables'),
(2, 'Dairy & Eggs',    'Milk, eggs and chilled dairy products'),
(3, 'Bakery',          'Bread and baked goods'),
(4, 'Beverages',       'Water, coffee and other drinks'),
(5, 'Pantry',          'Rice, noodles, cooking ingredients and canned food'),
(6, 'Frozen Foods',    'Frozen ready-to-cook foods'),
(7, 'Household',       'Cleaning and paper products'),
(8, 'Personal Care',   'Everyday personal care products'),
(9, 'Meat & Seafood',  'Fresh meat and seafood');

-- ========== EMPLOYEES ==========
INSERT INTO employee (employee_id, employee_name, role, phone, hire_date) VALUES
(1, 'Narin Srisuk',  'Cashier', '000-000-0001', '2022-01-15'),
(2, 'Mali Kittima',  'Cashier', '000-000-0002', '2022-03-20'),
(3, 'Anong Prasert', 'Manager', '000-000-0003', '2021-06-01'),
(4, 'Krit Chaiyo',   'Stock',   '000-000-0004', '2022-09-10'),
(5, 'Pim Rattan',    'Cashier', '000-000-0005', '2023-02-12');

-- ========== SUPPLIERS ==========
INSERT INTO supplier (supplier_id, supplier_name, contact_name, phone, email) VALUES
(5,  'Northern Fresh Produce', 'Sample Contact 1', '000-555-0001', 'produce@example.test'),
(6,  'Lanna Dairy Supply',     'Sample Contact 2', '000-555-0002', 'dairy@example.test'),
(7,  'Daily Bake Wholesale',   'Sample Contact 3', '000-555-0003', 'bakery@example.test'),
(8,  'Chiang Mai Beverage Co.','Sample Contact 4', '000-555-0004', 'beverages@example.test'),
(9,  'Northern Wholesale Foods','Sample Contact 5','000-555-0005', 'foods@example.test'),
(10, 'Home & Care Supply',     'Sample Contact 6', '000-555-0006', 'care@example.test');

-- ========== PRODUCTS ==========
INSERT INTO product (product_id, product_name, unit_price, barcode, category_id) VALUES
(101, 'Bananas, bunch', 35.00, '88500000101', 1),
(102, 'Tomatoes, 1 kg', 45.00, '88500000102', 1),
(103, 'Oranges, 1 kg', 59.00, '88500000103', 1),
(104, 'Eggs, 10 pack', 55.00, '88500000104', 2),
(105, 'Fresh milk, 1 L', 48.00, '88500000105', 2),
(106, 'Yogurt, cup', 20.00, '88500000106', 2),
(107, 'White bread, loaf', 38.00, '88500000107', 3),
(108, 'Bottled water, 1.5 L', 15.00, '88500000108', 4),
(109, 'Ground coffee, 250 g', 129.00, '88500000109', 4),
(110, 'Jasmine rice, 5 kg', 189.00, '88500000110', 5),
(111, 'Instant noodles, pack', 7.00, '88500000111', 5),
(112, 'Cooking oil, 1 L', 62.00, '88500000112', 5),
(113, 'Canned tuna', 32.00, '88500000113', 5),
(114, 'Frozen dumplings, 400 g', 79.00, '88500000114', 6),
(115, 'Dishwashing liquid, 500 ml', 42.00, '88500000115', 7),
(116, 'Tissue paper, pack', 55.00, '88500000116', 7),
(117, 'Shampoo, 350 ml', 109.00, '88500000117', 8),
(118, 'Chicken breast, 1 kg', 105.00, '88500000118', 9);

-- ========== INVENTORY ==========
INSERT INTO inventory (product_id, quantity_in_stock, reorder_level, last_updated) VALUES
(101, 12, 15, DATE_SUB(NOW(), INTERVAL 0 DAY)),
(102, 28, 12, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(103, 20, 12, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(104, 18, 20, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(105, 40, 20, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(106, 9, 12, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(107, 9, 10, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(108, 72, 30, DATE_SUB(NOW(), INTERVAL 0 DAY)),
(109, 7, 8, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(110, 24, 15, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(111, 100, 40, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(112, 11, 10, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(113, 34, 15, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(114, 6, 8, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(115, 18, 8, DATE_SUB(NOW(), INTERVAL 0 DAY)),
(116, 45, 15, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(117, 13, 8, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(118, 5, 10, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ========== PRODUCT_SUPPLIER ==========
INSERT INTO product_supplier (product_id, supplier_id, supply_price, supplier_product_code, lead_time_days) VALUES
(101, 5, 20.00, 'NF-BANANA', 2),
(102, 5, 28.00, 'NF-TOMATO', 2),
(103, 5, 36.00, 'NF-ORANGE', 2),
(104, 6, 41.00, 'LD-EGGS10', 2),
(105, 6, 34.00, 'LD-MILK1L', 2),
(106, 6, 13.00, 'LD-YOGURT', 2),
(107, 7, 24.00, 'DB-BREAD', 1),
(108, 8, 5.00, 'CB-WATER15', 2),
(109, 8, 85.00, 'CB-COFFEE250', 4),
(110, 9, 150.00, 'NW-RICE5K', 3),
(111, 9, 4.00, 'NW-NOODLE', 3),
(112, 9, 48.00, 'NW-OIL1L', 3),
(113, 9, 22.00, 'NW-TUNA', 3),
(114, 9, 55.00, 'NW-DUMPLING', 4),
(115, 10, 27.00, 'HC-DISH500', 3),
(116, 10, 36.00, 'HC-TISSUE', 3),
(117, 10, 72.00, 'HC-SHAMPOO', 3),
(118, 5, 78.00, 'NF-CHICKEN', 2);

-- ========== PURCHASE_ORDERS ==========
INSERT INTO purchase_order
(purchase_order_id, order_date, expected_delivery_date, status, supplier_id, employee_id) VALUES
(9001, DATE_SUB(CURDATE(), INTERVAL 16 DAY), DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'received', 5, 4),
(9002, DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_SUB(CURDATE(), INTERVAL 9 DAY),  'received', 6, 4),
(9003, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  DATE_ADD(CURDATE(), INTERVAL 1 DAY),  'pending',  8, 4),
(9004, DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_SUB(CURDATE(), INTERVAL 37 DAY), 'received', 10, 3),
(9005, DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 58 DAY), 'cancelled', 9, 3);

-- ========== PURCHASE_ORDER_ITEMS ==========
INSERT INTO purchase_order_item
(purchase_order_id, product_id, quantity_ordered, quantity_received, purchase_unit_price) VALUES
(9001, 101, 50, 50, 20.00),
(9001, 104, 60, 60, 41.00),
(9002, 105, 100, 100, 34.00),
(9002, 107, 50, 50, 24.00),
(9003, 110, 30, 0, 150.00),
(9003, 111, 240, 0, 4.00),
(9004, 115, 36, 36, 27.00),
(9004, 116, 24, 24, 36.00),
(9005, 118, 25, 0, 78.00);

-- ========== SUPPLIER_ISSUES ==========
INSERT INTO supplier_issue
(issue_id, issue_type, description, status, issue_date, resolved_date,
 purchase_order_id, employee_id) VALUES
(1, 'Late delivery', 'Order 9001 arrived after the expected date', 'resolved',
    TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 12 DAY), '09:15:00'), DATE_SUB(CURDATE(), INTERVAL 11 DAY), 9001, 3),
(2, 'Damaged goods', 'Some eggs were damaged in order 9002', 'open',
    TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 8 DAY), '14:40:00'), NULL, 9002, 4),
(3, 'Short delivery', 'Part of the order is still being checked', 'in_progress',
    TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '11:25:00'), NULL, 9003, 4);

-- ========== SALES ==========
INSERT INTO sale (sale_id, sale_date_time, payment_method, employee_id) VALUES
(1001, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 0 DAY), '08:00:00'), 'cash', 1),
(1002, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 0 DAY), '15:17:00'), 'card', 2),
(1003, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 0 DAY), '09:34:00'), 'transfer', 3),
(1004, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '16:51:00'), 'cash', 4),
(1005, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:08:00'), 'card', 5),
(1006, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '17:25:00'), 'transfer', 1),
(1007, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '11:42:00'), 'cash', 2),
(1008, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '18:59:00'), 'card', 3),
(1009, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '12:16:00'), 'transfer', 4),
(1010, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '19:33:00'), 'cash', 5),
(1011, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '13:50:00'), 'card', 1),
(1012, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '20:07:00'), 'transfer', 2),
(1013, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '14:24:00'), 'cash', 3),
(1014, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '08:41:00'), 'card', 4),
(1015, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 8 DAY), '15:58:00'), 'transfer', 5),
(1016, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 9 DAY), '09:15:00'), 'cash', 1),
(1017, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 10 DAY), '16:32:00'), 'card', 2),
(1018, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 11 DAY), '10:49:00'), 'transfer', 3),
(1019, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 12 DAY), '17:06:00'), 'cash', 4),
(1020, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 13 DAY), '11:23:00'), 'card', 5),
(1021, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 14 DAY), '18:40:00'), 'transfer', 1),
(1022, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 15 DAY), '12:57:00'), 'cash', 2),
(1023, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 16 DAY), '19:14:00'), 'card', 3),
(1024, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 17 DAY), '13:31:00'), 'transfer', 4),
(1025, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 18 DAY), '20:48:00'), 'cash', 5),
(1026, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 19 DAY), '14:05:00'), 'card', 1),
(1027, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 20 DAY), '08:22:00'), 'transfer', 2),
(1028, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 21 DAY), '15:39:00'), 'cash', 3),
(1029, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 23 DAY), '09:56:00'), 'card', 4),
(1030, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 29 DAY), '16:13:00'), 'transfer', 5),
(1031, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 35 DAY), '10:30:00'), 'cash', 1),
(1032, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 42 DAY), '17:47:00'), 'card', 2),
(1033, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 49 DAY), '11:04:00'), 'transfer', 3),
(1034, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 56 DAY), '18:21:00'), 'cash', 4),
(1035, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 63 DAY), '12:38:00'), 'card', 5),
(1036, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 70 DAY), '19:55:00'), 'transfer', 1),
(1037, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 84 DAY), '13:12:00'), 'cash', 2),
(1038, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 90 DAY), '20:29:00'), 'card', 3),
(1039, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 120 DAY), '14:46:00'), 'transfer', 4),
(1040, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 365 DAY), '08:03:00'), 'cash', 5);

-- ========== SALE_ITEMS ==========
INSERT INTO sale_item
(sale_id, product_id, quantity, sale_unit_price, discount_amount) VALUES
(1001, 110, 2, 189.00, 2.00),
(1001, 101, 1, 35.00, 0.00),
(1001, 109, 1, 129.00, 0.00),
(1002, 104, 3, 55.00, 0.00),
(1002, 102, 2, 45.00, 0.00),
(1003, 111, 4, 7.00, 0.00),
(1003, 103, 3, 59.00, 0.00),
(1004, 105, 5, 48.00, 0.00),
(1004, 106, 1, 20.00, 0.00),
(1005, 108, 2, 15.00, 0.00),
(1005, 107, 2, 38.00, 0.00),
(1005, 117, 1, 109.00, 0.00),
(1006, 110, 3, 189.00, 0.00),
(1006, 112, 3, 62.00, 0.00),
(1007, 104, 4, 55.00, 2.00),
(1007, 113, 1, 32.00, 0.00),
(1008, 111, 5, 7.00, 0.00),
(1008, 114, 2, 79.00, 0.00),
(1009, 105, 2, 48.00, 0.00),
(1009, 115, 3, 42.00, 0.00),
(1009, 109, 1, 129.00, 0.00),
(1010, 108, 3, 15.00, 0.00),
(1010, 116, 1, 55.00, 0.00),
(1011, 110, 4, 189.00, 0.00),
(1011, 118, 2, 105.00, 0.00),
(1012, 104, 5, 55.00, 0.00),
(1012, 101, 3, 35.00, 0.00),
(1013, 111, 2, 7.00, 2.00),
(1013, 102, 1, 45.00, 0.00),
(1013, 117, 1, 109.00, 0.00),
(1014, 105, 3, 48.00, 0.00),
(1014, 103, 2, 59.00, 0.00),
(1015, 108, 4, 15.00, 0.00),
(1015, 106, 3, 20.00, 0.00),
(1016, 110, 5, 189.00, 0.00),
(1016, 107, 1, 38.00, 0.00),
(1017, 104, 2, 55.00, 0.00),
(1017, 112, 2, 62.00, 0.00),
(1017, 109, 1, 129.00, 0.00),
(1018, 111, 3, 7.00, 0.00),
(1018, 113, 3, 32.00, 0.00),
(1019, 105, 4, 48.00, 2.00),
(1019, 114, 1, 79.00, 0.00),
(1020, 108, 5, 15.00, 0.00),
(1020, 115, 2, 42.00, 0.00),
(1021, 110, 2, 189.00, 0.00),
(1021, 116, 3, 55.00, 0.00),
(1021, 117, 1, 109.00, 0.00),
(1022, 104, 3, 55.00, 0.00),
(1022, 118, 1, 105.00, 0.00),
(1023, 111, 4, 7.00, 0.00),
(1023, 101, 2, 35.00, 0.00),
(1024, 105, 5, 48.00, 0.00),
(1024, 102, 3, 45.00, 0.00),
(1025, 108, 2, 15.00, 2.00),
(1025, 103, 1, 59.00, 0.00),
(1025, 109, 1, 129.00, 0.00),
(1026, 110, 3, 189.00, 0.00),
(1026, 106, 2, 20.00, 0.00),
(1027, 104, 4, 55.00, 0.00),
(1027, 107, 3, 38.00, 0.00),
(1028, 111, 5, 7.00, 0.00),
(1028, 112, 1, 62.00, 0.00),
(1029, 105, 2, 48.00, 0.00),
(1029, 113, 2, 32.00, 0.00),
(1029, 117, 1, 109.00, 0.00),
(1030, 108, 3, 15.00, 0.00),
(1030, 114, 3, 79.00, 0.00),
(1031, 110, 4, 189.00, 2.00),
(1031, 115, 1, 42.00, 0.00),
(1032, 104, 5, 55.00, 0.00),
(1032, 116, 2, 55.00, 0.00),
(1033, 111, 2, 7.00, 0.00),
(1033, 118, 3, 105.00, 0.00),
(1033, 109, 1, 129.00, 0.00),
(1034, 105, 3, 48.00, 0.00),
(1034, 101, 1, 35.00, 0.00),
(1035, 108, 4, 15.00, 0.00),
(1035, 102, 2, 45.00, 0.00),
(1036, 110, 5, 189.00, 0.00),
(1036, 103, 3, 59.00, 0.00),
(1037, 104, 2, 55.00, 2.00),
(1037, 106, 1, 20.00, 0.00),
(1037, 117, 1, 109.00, 0.00),
(1038, 111, 3, 7.00, 0.00),
(1038, 107, 2, 38.00, 0.00),
(1039, 105, 4, 48.00, 0.00),
(1039, 112, 3, 62.00, 0.00),
(1040, 108, 5, 15.00, 0.00),
(1040, 113, 1, 32.00, 0.00);
