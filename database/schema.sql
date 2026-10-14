DROP DATABASE IF EXISTS se212_smartstock;
CREATE DATABASE IF NOT EXISTS se212_smartstock
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;

USE se212_smartstock;

-- 1. Category (no FKs)
CREATE TABLE category (
    category_id    INT PRIMARY KEY AUTO_INCREMENT,
    category_name  VARCHAR(100) NOT NULL,
    description    VARCHAR(255)
);

-- 2. EMPLOYEE (no FKs)
CREATE TABLE employee (
    employee_id    INT PRIMARY KEY AUTO_INCREMENT,
    employee_name  VARCHAR(100) NOT NULL,
    role           VARCHAR(50),
    phone          VARCHAR(20),
    hire_date      DATE
);

-- 3. SUPPLIER (no FKs)
CREATE TABLE supplier (
    supplier_id    INT PRIMARY KEY AUTO_INCREMENT,
    supplier_name  VARCHAR(100) NOT NULL,
    contact_name   VARCHAR(100),
    phone          VARCHAR(20),
    email          VARCHAR(100)
);

-- 4. PRODUCT (FK -> CATEGORY)
CREATE TABLE product (
    product_id     INT PRIMARY KEY AUTO_INCREMENT,
    product_name   VARCHAR(100) NOT NULL,
    unit_price     DECIMAL(10, 2) NOT NULL,
    barcode        VARCHAR(50) UNIQUE,
    category_id    INT,
    FOREIGN KEY (category_id) REFERENCES category(category_id)
);

-- 5. INVENTORY (FK -> PRODUCT, one-to-one)
CREATE TABLE inventory (
    product_id    INT PRIMARY KEY,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    reorder_level     INT NOT NULL DEFAULT 0,
    last_updated      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(product_id)
);

-- 6. PRODUCT_SUPPLIER (M:N between PRODUCT and SUPPLIER)
CREATE TABLE product_supplier (
    product_id        INT NOT NULL,
    supplier_id       INT NOT NULL,
    supply_price      DECIMAL(10, 2) NOT NULL,
    supplier_product_code VARCHAR(50),
    lead_time_days    INT,
    PRIMARY KEY (product_id, supplier_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id),
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id)
);

-- 7. PURCHASE_ORDER (FK -> SUPPLIER, EMPLOYEE)
CREATE TABLE purchase_order (
    purchase_order_id     INT PRIMARY KEY AUTO_INCREMENT,
    order_date            DATE NOT NULL,
    expected_delivery_date DATE,
    status                VARCHAR(20) DEFAULT 'pending',
    supplier_id           INT NOT NULL,
    employee_id           INT NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id),
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
);

-- 8. PURCHASE_ORDER_ITEM (M:N between PURCHASE_ORDER and PRODUCT)
CREATE TABLE purchase_order_item (
    purchase_order_id    INT NOT NULL,
    product_id           INT NOT NULL,
    quantity_ordered     INT NOT NULL,
    quantity_received    INT DEFAULT 0,
    purchase_unit_price  DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (purchase_order_id, product_id),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(purchase_order_id),
    FOREIGN KEY (product_id)        REFERENCES product(product_id)
);

-- 9. SUPPLIER_ISSUE (FK -> PURCHASE_ORDER, EMPLOYEE)
CREATE TABLE supplier_issue (
    issue_id             INT PRIMARY KEY AUTO_INCREMENT,
    issue_type           VARCHAR(50),
    description          VARCHAR(255),
    status               VARCHAR(20) DEFAULT 'open',
    issue_date           DATE NOT NULL,
    resolved_date         DATE,
    purchase_order_id    INT,
    employee_id          INT,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(purchase_order_id),
    FOREIGN KEY (employee_id)       REFERENCES employee(employee_id)
);

-- 10. SALE (FK -> EMPLOYEE)
CREATE TABLE sale (
    sale_id           INT PRIMARY KEY AUTO_INCREMENT,
    sale_date_time    DATETIME NOT NULL,
    payment_method    VARCHAR(20),
    employee_id       INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
);

-- 11. SALE_ITEM (M:N betweeen SALE and PRODUCT)
CREATE TABLE sale_item(
    sale_id            INT NOT NULL,
    product_id         INT NOT NULL,
    quantity           INT NOT NULL,
    sale_unit_price    DECIMAL(10, 2) NOT NULL,
    discount_amount    DECIMAL(10, 2) DEFAULT 0,
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id)    REFERENCES sale(sale_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id)
);

SHOW TABLES;













