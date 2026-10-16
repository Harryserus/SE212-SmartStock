const express = require("express");
const pool = require("../db");
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const [r] = await pool.query(
      "SELECT supplier_id AS supplierId,supplier_name AS supplierName,contact_name AS contactName,phone,email FROM supplier ORDER BY supplier_name",
    );
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const [r] = await pool.execute(
      "SELECT supplier_id AS supplierId,supplier_name AS supplierName,contact_name AS contactName,phone,email FROM supplier WHERE supplier_id=?",
      [req.params.id],
    );
    if (!r.length) return res.status(404).json({ error: "Supplier not found" });
    res.json(r[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});
router.post("/", async (req, res) => {
  const {
    supplierName,
    contactName = null,
    phone = null,
    email = null,
  } = req.body || {};
  if (typeof supplierName !== "string" || !supplierName.trim())
    return res.status(400).json({ error: "supplierName is required" });
  try {
    const [r] = await pool.execute(
      "INSERT INTO supplier(supplier_name,contact_name,phone,email) VALUES(?,?,?,?)",
      [supplierName.trim(), contactName, phone, email],
    );
    res
      .status(201)
      .json({
        supplierId: r.insertId,
        supplierName: supplierName.trim(),
        contactName,
        phone,
        email,
      });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});
router.put("/:id", async (req, res) => {
  const {
    supplierName,
    contactName = null,
    phone = null,
    email = null,
  } = req.body || {};
  if (typeof supplierName !== "string" || !supplierName.trim())
    return res.status(400).json({ error: "supplierName is required" });
  try {
    const [r] = await pool.execute(
      "UPDATE supplier SET supplier_name=?,contact_name=?,phone=?,email=? WHERE supplier_id=?",
      [supplierName.trim(), contactName, phone, email, req.params.id],
    );
    if (!r.affectedRows)
      return res.status(404).json({ error: "Supplier not found" });
    res.json({ message: "Supplier updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const [r] = await pool.execute("DELETE FROM supplier WHERE supplier_id=?", [
      req.params.id,
    ]);
    if (!r.affectedRows)
      return res.status(404).json({ error: "Supplier not found" });
    res.status(204).end();
  } catch (e) {
    res
      .status(409)
      .json({
        error:
          "Supplier is referenced by existing records and cannot be deleted",
      });
  }
});
module.exports = router;
