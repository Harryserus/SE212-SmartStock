const express = require("express");
const pool = require("../db");
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const [r] = await pool.query(
      `SELECT po.purchase_order_id AS purchaseOrderId,po.order_date AS orderDate,po.expected_delivery_date AS expectedDeliveryDate,po.status,po.supplier_id AS supplierId,s.supplier_name AS supplierName,po.employee_id AS employeeId FROM purchase_order po JOIN supplier s USING(supplier_id) ORDER BY po.order_date DESC`,
    );
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const [r] = await pool.execute(
      "SELECT purchase_order_id AS purchaseOrderId,order_date AS orderDate,expected_delivery_date AS expectedDeliveryDate,status,supplier_id AS supplierId,employee_id AS employeeId FROM purchase_order WHERE purchase_order_id=?",
      [req.params.id],
    );
    if (!r.length)
      return res.status(404).json({ error: "Purchase order not found" });
    const [items] = await pool.execute(
      "SELECT product_id AS productId,quantity_ordered AS quantityOrdered,quantity_received AS quantityReceived,purchase_unit_price AS purchaseUnitPrice FROM purchase_order_item WHERE purchase_order_id=?",
      [req.params.id],
    );
    res.json({ ...r[0], items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
});
router.post("/", async (req, res) => {
  const {
    supplierId,
    employeeId,
    orderDate,
    expectedDeliveryDate = null,
    items,
  } = req.body || {};
  if (
    !Number.isInteger(Number(supplierId)) ||
    !Number.isInteger(Number(employeeId)) ||
    !Array.isArray(items) ||
    !items.length ||
    items.some(
      (i) =>
        !Number.isInteger(Number(i.productId)) ||
        Number(i.quantityOrdered) < 1 ||
        !Number.isFinite(Number(i.purchaseUnitPrice)) ||
        Number(i.purchaseUnitPrice) < 0,
    )
  )
    return res
      .status(400)
      .json({ error: "Provide supplierId, employeeId, and valid order items" });
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [r] = await c.execute(
      "INSERT INTO purchase_order(order_date,expected_delivery_date,supplier_id,employee_id) VALUES(COALESCE(?,CURDATE()),?,?,?)",
      [orderDate || null, expectedDeliveryDate, supplierId, employeeId],
    );
    for (const i of items)
      await c.execute(
        "INSERT INTO purchase_order_item(purchase_order_id,product_id,quantity_ordered,quantity_received,purchase_unit_price) VALUES(?,?,?,?,?)",
        [r.insertId, i.productId, i.quantityOrdered, 0, i.purchaseUnitPrice],
      );
    await c.commit();
    res.status(201).json({ purchaseOrderId: r.insertId, status: "pending" });
  } catch (e) {
    await c.rollback();
    console.error(e);
    res
      .status(400)
      .json({
        error:
          "Could not create purchase order; check supplier, employee, products, and duplicate products",
      });
  } finally {
    c.release();
  }
});
router.patch("/:id/status", async (req, res) => {
  const status = String(req.body?.status || "");
  if (!["pending", "received", "partial", "cancelled"].includes(status))
    return res.status(400).json({ error: "Invalid purchase order status" });
  try {
    const [r] =
      status === "cancelled"
        ? await pool.execute(
            "UPDATE purchase_order SET status=? WHERE purchase_order_id=? AND status='pending'",
            [status, req.params.id],
          )
        : await pool.execute(
            "UPDATE purchase_order SET status=? WHERE purchase_order_id=?",
            [status, req.params.id],
          );
    if (!r.affectedRows) {
      const [rows] = await pool.execute(
        "SELECT status FROM purchase_order WHERE purchase_order_id=?",
        [req.params.id],
      );
      if (!rows.length)
        return res.status(404).json({ error: "Purchase order not found" });
      if (status === "cancelled")
        return res
          .status(409)
          .json({ error: "Only pending purchase orders can be cancelled" });
    }
    res.json({ message: "Purchase order status updated", status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update purchase order status" });
  }
});
router.post("/:id/receive", async (req, res) => {
  const items = req.body?.items;
  if (
    !Array.isArray(items) ||
    !items.length ||
    items.some(
      (i) =>
        !Number.isInteger(Number(i.productId)) ||
        !Number.isInteger(Number(i.quantityReceived)) ||
        Number(i.quantityReceived) < 0,
    )
  )
    return res
      .status(400)
      .json({
        error: "Provide items with productId and non-negative quantityReceived",
      });
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    for (const i of items) {
      const [r] = await c.execute(
        "UPDATE purchase_order_item SET quantity_received=quantity_received+? WHERE purchase_order_id=? AND product_id=? AND quantity_received+?<=quantity_ordered",
        [i.quantityReceived, req.params.id, i.productId, i.quantityReceived],
      );
      if (!r.affectedRows)
        throw new Error("Item not found or received quantity exceeds order");
      await c.execute(
        "UPDATE inventory SET quantity_in_stock=quantity_in_stock+?,last_updated=NOW() WHERE product_id=?",
        [i.quantityReceived, i.productId],
      );
    }
    await c.commit();
    res.json({ message: "Received quantities recorded and inventory updated" });
  } catch (e) {
    await c.rollback();
    console.error(e);
    res.status(400).json({ error: e.message });
  } finally {
    c.release();
  }
});
module.exports = router;
