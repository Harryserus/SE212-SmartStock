
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all inventory
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_id AS productId,
        p.product_name AS productName,
        i.quantity AS currentStock,
        p.reorder_level AS reorderLevel,
        CASE
          WHEN i.quantity <= p.reorder_level THEN TRUE
          ELSE FALSE
        END AS lowStock
      FROM inventory i
      JOIN product p ON i.product_id = p.product_id
      ORDER BY p.product_name
    `);

    res.json(rows);
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// GET products with low stock
router.get("/low-stock", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_id AS productId,
        p.product_name AS productName,
        i.quantity AS currentStock,
        p.reorder_level AS reorderLevel
      FROM inventory i
      JOIN product p ON i.product_id = p.product_id
      WHERE i.quantity <= p.reorder_level
      ORDER BY i.quantity ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Get low-stock error:", error);
    res.status(500).json({ error: "Failed to fetch low-stock products" });
  }
});

// ADD incoming stock
router.post("/stock-in", async (req, res) => {
  const productId = Number(req.body?.productId);
  const quantity = Number(req.body?.quantity);

  if (
    !Number.isInteger(productId) || productId < 1 ||
    !Number.isInteger(quantity) || quantity < 1
  ) {
    return res.status(400).json({
      error: "productId and positive integer quantity are required"
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE inventory
       SET quantity = quantity + ?
       WHERE product_id = ?`,
      [quantity, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Inventory record not found for this product"
      });
    }

    const [rows] = await pool.execute(
      `SELECT p.product_id AS productId,
              p.product_name AS productName,
              i.quantity AS currentStock
       FROM inventory i
       JOIN product p ON p.product_id = i.product_id
       WHERE p.product_id = ?`,
      [productId]
    );

    res.json({
      message: "Stock added successfully",
      ...rows[0]
    });
  } catch (error) {
    console.error("Stock-in error:", error);
    res.status(500).json({ error: "Failed to add stock" });
  }
});

// SET stock to a corrected quantity
router.post("/adjust", async (req, res) => {
  const productId = Number(req.body?.productId);
  const quantity = Number(req.body?.quantity);

  if (
    !Number.isInteger(productId) || productId < 1 ||
    !Number.isInteger(quantity) || quantity < 0
  ) {
    return res.status(400).json({
      error: "productId and non-negative integer quantity are required"
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE inventory
       SET quantity = ?
       WHERE product_id = ?`,
      [quantity, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Inventory record not found for this product"
      });
    }

    res.json({
      message: "Stock adjusted successfully",
      productId,
      currentStock: quantity
    });
  } catch (error) {
    console.error("Stock adjustment error:", error);
    res.status(500).json({ error: "Failed to adjust stock" });
  }
});

module.exports = router;

