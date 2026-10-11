
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_id AS productId,
        p.product_name AS productName,
        p.selling_price AS sellingPrice,
        p.cost_price AS costPrice,
        p.reorder_level AS reorderLevel,
        p.category_id AS categoryId,
        c.category_name AS categoryName,
        COALESCE(i.quantity, 0) AS currentStock
      FROM product p
      LEFT JOIN category c ON p.category_id = c.category_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      ORDER BY p.product_id
    `);

    res.json(rows);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET one product by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        p.product_id AS productId,
        p.product_name AS productName,
        p.selling_price AS sellingPrice,
        p.cost_price AS costPrice,
        p.reorder_level AS reorderLevel,
        p.category_id AS categoryId,
        c.category_name AS categoryName,
        COALESCE(i.quantity, 0) AS currentStock
      FROM product p
      LEFT JOIN category c ON p.category_id = c.category_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      WHERE p.product_id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// CREATE product
router.post("/", async (req, res) => {
  const {
    productName,
    sellingPrice,
    costPrice,
    reorderLevel,
    categoryId
  } = req.body || {};

  if (
    typeof productName !== "string" ||
    !productName.trim() ||
    !Number.isFinite(Number(sellingPrice)) ||
    !Number.isFinite(Number(costPrice)) ||
    Number(sellingPrice) < 0 ||
    Number(costPrice) < 0 ||
    !Number.isInteger(Number(reorderLevel)) ||
    Number(reorderLevel) < 0 ||
    !Number.isInteger(Number(categoryId)) ||
    Number(categoryId) < 1
  ) {
    return res.status(400).json({
      error: "Provide productName, non-negative sellingPrice and costPrice, non-negative integer reorderLevel, and valid categoryId"
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO product
       (product_name, selling_price, cost_price, reorder_level, category_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        productName.trim(),
        Number(sellingPrice),
        Number(costPrice),
        Number(reorderLevel),
        Number(categoryId)
      ]
    );

    await connection.execute(
      "INSERT INTO inventory (product_id, quantity) VALUES (?, 0)",
      [result.insertId]
    );

    await connection.commit();

    res.status(201).json({
      productId: result.insertId,
      productName: productName.trim(),
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
      reorderLevel: Number(reorderLevel),
      categoryId: Number(categoryId),
      currentStock: 0
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create product error:", error);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Category does not exist" });
    }

    res.status(500).json({ error: "Failed to create product" });
  } finally {
    connection.release();
  }
});

module.exports = router;

