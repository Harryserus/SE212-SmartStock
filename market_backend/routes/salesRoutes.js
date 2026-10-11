
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all sales
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        sale_id AS saleId,
        total_amount AS totalAmount,
        sale_date AS saleDate
      FROM sale
      ORDER BY sale_date DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

// GET one sale with its items
router.get("/:id", async (req, res) => {
  try {
    const [sales] = await pool.execute(`
      SELECT
        sale_id AS saleId,
        total_amount AS totalAmount,
        sale_date AS saleDate
      FROM sale
      WHERE sale_id = ?
    `, [req.params.id]);

    if (sales.length === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const [items] = await pool.execute(`
      SELECT
        si.product_id AS productId,
        p.product_name AS productName,
        si.quantity,
        si.unit_price AS unitPrice,
        si.subtotal
      FROM sale_item si
      JOIN product p ON p.product_id = si.product_id
      WHERE si.sale_id = ?
    `, [req.params.id]);

    res.json({
      ...sales[0],
      items
    });
  } catch (error) {
    console.error("Get sale error:", error);
    res.status(500).json({ error: "Failed to fetch sale" });
  }
});

// CREATE a sale
router.post("/", async (req, res) => {
  const items = req.body?.items;

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some(item =>
      !Number.isInteger(Number(item?.productId)) ||
      Number(item.productId) < 1 ||
      !Number.isInteger(Number(item?.quantity)) ||
      Number(item.quantity) < 1
    )
  ) {
    return res.status(400).json({
      error: "Provide items with a valid productId and positive integer quantity"
    });
  }

  // Combine duplicate product IDs into one line
  const quantities = new Map();

  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    quantities.set(
      productId,
      (quantities.get(productId) || 0) + quantity
    );
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let totalAmount = 0;
    const saleItems = [];

    // Lock inventory rows so concurrent sales cannot oversell stock
    for (const [productId, quantity] of quantities) {
      const [rows] = await connection.execute(`
        SELECT
          p.product_id AS productId,
          p.product_name AS productName,
          p.selling_price AS sellingPrice,
          i.quantity AS currentStock
        FROM product p
        JOIN inventory i ON i.product_id = p.product_id
        WHERE p.product_id = ?
        FOR UPDATE
      `, [productId]);

      if (rows.length === 0) {
        throw Object.assign(
          new Error(`Product ${productId} not found`),
          { statusCode: 400 }
        );
      }

      const product = rows[0];

      if (Number(product.currentStock) < quantity) {
        throw Object.assign(
          new Error(
            `Insufficient stock for ${product.productName}. Available: ${product.currentStock}`
          ),
          { statusCode: 409 }
        );
      }

      const unitPrice = Number(product.sellingPrice);
      const subtotal = Number((unitPrice * quantity).toFixed(2));

      totalAmount += subtotal;

      saleItems.push({
        productId,
        productName: product.productName,
        quantity,
        unitPrice,
        subtotal
      });

      await connection.execute(
        "UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?",
        [quantity, productId]
      );
    }

    totalAmount = Number(totalAmount.toFixed(2));

    const [saleResult] = await connection.execute(
      "INSERT INTO sale (total_amount, sale_date) VALUES (?,NOW())",
      [totalAmount]
    );

    for (const item of saleItems) {
      await connection.execute(`
        INSERT INTO sale_item
          (sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [
        saleResult.insertId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.subtotal
      ]);
    }

    await connection.commit();

    res.status(201).json({
      message: "Sale recorded successfully",
      saleId: saleResult.insertId,
      totalAmount,
      items: saleItems
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Create sale error:", error);

    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to record sale"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;

