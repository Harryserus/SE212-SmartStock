DROP DATABASE IF EXISTS se212_normalization_demo;
CREATE DATABASE se212_normalization_demo
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
USE se212_normalization_demo;

-- ============================================================
-- SALE entity: Stage 0 — UNF (Unnormalized Form)
-- ============================================================

CREATE TABLE sale_unnf (
    sale_id         INT,
    sale_date       DATE,
    employee_id     INT,
    employee_name   VARCHAR(100),
    employee_role   VARCHAR(50),
    product_ids     VARCHAR(200),
    product_names   VARCHAR(500),
    quantities      VARCHAR(100),
    unit_prices     VARCHAR(200),
    total           DECIMAL(10,2)
);

INSERT INTO sale_unnf
(sale_id, sale_date, employee_id, employee_name, employee_role,
 product_ids, product_names, quantities, unit_prices, total)
VALUES
(1001, '2026-09-30', 1, 'Somchai', 'Cashier',
 '101,205', 'Widget,Gizmo', '2,1', '9.99,19.99', 39.97),
(1002, '2026-09-30', 1, 'Somchai', 'Cashier',
 '103', 'Doohickey', '5', '4.50', 22.50),
(1003, '2026-09-30', 2, 'Malee', 'Cashier',
 '101', 'Widget', '1', '9.99', 9.99);

SELECT * FROM sale_unnf;

-- ============================================================
-- STAGE 1: 1NF — atomic cells, one row per (sale, product)
-- ============================================================

CREATE TABLE sale_1nf (
    sale_id         INT,
    sale_date       DATE,
    employee_id     INT,
    employee_name   VARCHAR(100),   -- still repeated — 2NF will fix
    employee_role   VARCHAR(50),    -- still repeated — 2NF will fix
    product_id      INT,            -- atomic now
    product_name    VARCHAR(100),   -- atomic now
    quantity        INT,            -- atomic now
    unit_price      DECIMAL(10,2),  -- atomic now
    PRIMARY KEY (sale_id, product_id)
);

INSERT INTO sale_1nf
(sale_id, sale_date, employee_id, employee_name, employee_role,
 product_id, product_name, quantity, unit_price)
VALUES
-- Sale 1001 was "101,205" → now TWO rows
(1001, '2026-09-30', 1, 'Somchai', 'Cashier', 101, 'Widget',    2,  9.99),
(1001, '2026-09-30', 1, 'Somchai', 'Cashier', 205, 'Gizmo',     1, 19.99),
-- Sale 1002 → ONE row (already atomic in UNF)
(1002, '2026-09-30', 1, 'Somchai', 'Cashier', 103, 'Doohickey', 5,  4.50),
-- Sale 1003 → ONE row
(1003, '2026-09-30', 2, 'Malee',   'Cashier', 101, 'Widget',    1,  9.99);

USE se212_normalization_demo;
SELECT * FROM sale_1nf;

SELECT SUM(quantity) AS widgets_sold
FROM sale_1nf
WHERE product_id = 101;

-- UNF: returns 1 row (WRONG — sale 1001 also has Widget but is skipped)
SELECT * FROM sale_unnf WHERE product_ids = '101';

-- On 1NF — returns 2 rows(atomic values)
SELECT * FROM sale_1nf WHERE product_id = 101;

-- ============================================================
-- STAGE 2: 2NF — remove partial dependencies
-- Each lookup table holds its own facts once
-- ============================================================

-- Employees (no dependency on sales)
CREATE TABLE employee_2nf (
    employee_id   INT PRIMARY KEY,
    employee_name VARCHAR(100),
    employee_role VARCHAR(50)
);

-- Products (no dependency on sales)
CREATE TABLE product_2nf (
    product_id     INT PRIMARY KEY,
    product_name   VARCHAR(100),
    category_id    INT,
    category_name  VARCHAR(100)   -- still a transitive dep — 3NF will fix
);

-- Sales (no employee_name repeated, no product info)
CREATE TABLE sale_2nf (
    sale_id     INT PRIMARY KEY,
    sale_date   DATE,
    employee_id INT,
    FOREIGN KEY (employee_id) REFERENCES employee_2nf(employee_id)
);

-- Sale line items (quantity + price depend on BOTH keys)
CREATE TABLE sale_item_2nf (
    sale_id    INT,
    product_id INT,
    quantity   INT,
    unit_price DECIMAL(10,2),
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id)    REFERENCES sale_2nf(sale_id),
    FOREIGN KEY (product_id) REFERENCES product_2nf(product_id)
);

-- ------------------------------------------------------------
-- Data — the same 3 sales, now spread across 4 tables
-- ------------------------------------------------------------

INSERT INTO employee_2nf VALUES
(1, 'Somchai', 'Cashier'),
(2, 'Malee',   'Cashier');

INSERT INTO product_2nf VALUES
(101, 'Widget',    3, 'Hardware'),
(205, 'Gizmo',     4, 'Electronics'),
(103, 'Doohickey', 3, 'Hardware');

INSERT INTO sale_2nf VALUES
(1001, '2026-09-30', 1),
(1002, '2026-09-30', 1),
(1003, '2026-09-30', 2);

INSERT INTO sale_item_2nf VALUES
(1001, 101, 2,  9.99),
(1001, 205, 1, 19.99),
(1002, 103, 5,  4.50),
(1003, 101, 1,  9.99);

USE se212_normalization_demo;

-- Confirm each table has its own rows
SELECT * FROM employee_2nf;      -- 2 rows
SELECT * FROM product_2nf;       -- 3 rows
SELECT * FROM sale_2nf;          -- 3 rows
SELECT * FROM sale_item_2nf;     -- 4 rows

SELECT e.employee_name,
       p.product_name,
       SUM(si.quantity) AS total_sold
FROM sale_item_2nf si
JOIN sale_2nf s     ON si.sale_id    = s.sale_id
JOIN employee_2nf e ON s.employee_id = e.employee_id
JOIN product_2nf p  ON si.product_id = p.product_id
WHERE e.employee_name = 'Somchai' AND p.product_name = 'Widget'
GROUP BY e.employee_name, p.product_name;

-- ============================================================
-- STAGE 3: 3NF — remove transitive dependencies
-- category_name depends on category_id, not on product_id
-- ============================================================

-- Categories (own their own facts)
CREATE TABLE category_3nf (
    category_id   INT PRIMARY KEY,
    category_name VARCHAR(100)
);

-- Products now reference category by ID only
CREATE TABLE product_3nf (
    product_id   INT PRIMARY KEY,
    product_name VARCHAR(100),
    category_id  INT,
    FOREIGN KEY (category_id) REFERENCES category_3nf(category_id)
);

-- Employees (already 3NF — no changes)
CREATE TABLE employee_3nf (
    employee_id   INT PRIMARY KEY,
    employee_name VARCHAR(100),
    employee_role VARCHAR(50)
);

-- Sales (already 3NF — no changes)
CREATE TABLE sale_3nf (
    sale_id     INT PRIMARY KEY,
    sale_date   DATE,
    employee_id INT,
    FOREIGN KEY (employee_id) REFERENCES employee_3nf(employee_id)
);

-- Sale items (already 3NF — quantity + price depend on whole key)
CREATE TABLE sale_item_3nf (
    sale_id    INT,
    product_id INT,
    quantity   INT,
    unit_price DECIMAL(10,2),
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id)    REFERENCES sale_3nf(sale_id),
    FOREIGN KEY (product_id) REFERENCES product_3nf(product_id)
);

-- ------------------------------------------------------------
-- Data — same business facts, now fully normalized
-- ------------------------------------------------------------

INSERT INTO category_3nf VALUES
(3, 'Hardware'),
(4, 'Electronics');

INSERT INTO product_3nf VALUES
(101, 'Widget',    3),
(205, 'Gizmo',     4),
(103, 'Doohickey', 3);

INSERT INTO employee_3nf VALUES
(1, 'Somchai', 'Cashier'),
(2, 'Malee',   'Cashier');

INSERT INTO sale_3nf VALUES
(1001, '2026-09-30', 1),
(1002, '2026-09-30', 1),
(1003, '2026-09-30', 2);

INSERT INTO sale_item_3nf VALUES
(1001, 101, 2,  9.99),
(1001, 205, 1, 19.99),
(1002, 103, 5,  4.50),
(1003, 101, 1,  9.99);

USE se212_normalization_demo;

SELECT * FROM category_3nf;      -- 2 rows
SELECT * FROM product_3nf;       -- 3 rows
SELECT * FROM employee_3nf;      -- 2 rows
SELECT * FROM sale_3nf;          -- 3 rows
SELECT * FROM sale_item_3nf;     -- 4 rows

-- Question: "How many Widgets did Somchai sell?"
SELECT e.employee_name,
       p.product_name,
       c.category_name,
       SUM(si.quantity) AS total_sold
FROM sale_item_3nf si
JOIN sale_3nf s      ON si.sale_id    = s.sale_id
JOIN employee_3nf e  ON s.employee_id = e.employee_id
JOIN product_3nf p   ON si.product_id = p.product_id
JOIN category_3nf c  ON p.category_id = c.category_id
WHERE e.employee_name = 'Somchai' AND p.product_name = 'Widget'
GROUP BY e.employee_name, p.product_name, c.category_name;
