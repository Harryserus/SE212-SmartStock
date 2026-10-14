const express = require("express");
const pool = require("../db");
const router = express.Router();

const productSelect = `
  SELECT p.product_id AS productId, p.product_name AS productName,
         p.barcode, p.unit_price AS unitPrice, p.category_id AS categoryId,
         c.category_name AS categoryName, COALESCE(i.quantity_in_stock, 0) AS quantityInStock,
         i.reorder_level AS reorderLevel
  FROM product p
  JOIN category c ON c.category_id = p.category_id
  LEFT JOIN inventory i ON i.product_id = p.product_id`;

router.get("/", async (req, res) => {
  try { const [rows] = await pool.query(productSelect + " ORDER BY p.product_id"); res.json(rows); }
  catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch products" }); }
});
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(productSelect + " WHERE p.product_id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch product" }); }
});
router.post("/", async (req, res) => {
  const { productName, barcode = null, unitPrice, categoryId, quantityInStock = 0, reorderLevel = 0 } = req.body || {};
  if (typeof productName !== "string" || !productName.trim() || !Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0 ||
      !Number.isInteger(Number(categoryId)) || Number(categoryId) < 1 ||
      !Number.isInteger(Number(quantityInStock)) || Number(quantityInStock) < 0 ||
      !Number.isInteger(Number(reorderLevel)) || Number(reorderLevel) < 0)
    return res.status(400).json({ error: "Provide productName, non-negative unitPrice, valid categoryId, quantityInStock, and reorderLevel" });
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [p] = await c.execute("INSERT INTO product (product_name, barcode, unit_price, category_id) VALUES (?, ?, ?, ?)",
      [productName.trim(), barcode, Number(unitPrice), Number(categoryId)]);
    await c.execute("INSERT INTO inventory (product_id, quantity_in_stock, reorder_level) VALUES (?, ?, ?)",
      [p.insertId, Number(quantityInStock), Number(reorderLevel)]);
    await c.commit();
    res.status(201).json({ productId: p.insertId, productName: productName.trim(), barcode, unitPrice: Number(unitPrice), categoryId: Number(categoryId), quantityInStock: Number(quantityInStock), reorderLevel: Number(reorderLevel) });
  } catch (e) {
    await c.rollback(); console.error(e);
    res.status(e.code === "ER_NO_REFERENCED_ROW_2" ? 400 : e.code === "ER_DUP_ENTRY" ? 409 : 500)
      .json({ error: e.code === "ER_NO_REFERENCED_ROW_2" ? "Category does not exist" : e.code === "ER_DUP_ENTRY" ? "Barcode already exists" : "Failed to create product" });
  } finally { c.release(); }
});
router.put("/:id", async (req, res) => {
  const { productName, barcode = null, unitPrice, categoryId, reorderLevel } = req.body || {};
  if (typeof productName !== "string" || !productName.trim() || !Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0 ||
      !Number.isInteger(Number(categoryId)) || Number(categoryId) < 1 || !Number.isInteger(Number(reorderLevel)) || Number(reorderLevel) < 0)
    return res.status(400).json({ error: "Provide productName, non-negative unitPrice, categoryId, and reorderLevel" });
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [r] = await c.execute("UPDATE product SET product_name=?, barcode=?, unit_price=?, category_id=? WHERE product_id=?",
      [productName.trim(), barcode, Number(unitPrice), Number(categoryId), req.params.id]);
    if (!r.affectedRows) { await c.rollback(); return res.status(404).json({ error: "Product not found" }); }
    await c.execute("UPDATE inventory SET reorder_level=? WHERE product_id=?", [Number(reorderLevel), req.params.id]);
    await c.commit(); res.json({ message: "Product updated" });
  } catch (e) { await c.rollback(); console.error(e); res.status(e.code === "ER_DUP_ENTRY" ? 409 : 500).json({ error: e.code === "ER_DUP_ENTRY" ? "Barcode already exists" : "Failed to update product" }); }
  finally { c.release(); }
});
router.delete("/:id", async (req, res) => {
  try {
    const [r] = await pool.execute("DELETE FROM product WHERE product_id=?", [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: "Product not found" });
    res.status(204).end();
  } catch (e) { console.error(e); res.status(409).json({ error: "Product is referenced by existing records and cannot be deleted" }); }
});
module.exports = router;
