const express = require("express");
const pool = require("../db");
const router = express.Router();
const totalExpr =
  "SUM(si.quantity * si.sale_unit_price - COALESCE(si.discount_amount,0))";
router.get("/", async (req, res) => {
  try {
    const [rows] =
      await pool.query(`SELECT s.sale_id AS saleId,s.sale_date_time AS saleDateTime,s.payment_method AS paymentMethod,
    s.employee_id AS employeeId,e.employee_name AS employeeName,COALESCE(${totalExpr},0) AS totalAmount,
    GROUP_CONCAT(DISTINCT p.product_name ORDER BY p.product_name SEPARATOR ' • ') AS productNames
    FROM sale s JOIN employee e ON e.employee_id=s.employee_id LEFT JOIN sale_item si ON si.sale_id=s.sale_id
    LEFT JOIN product p ON p.product_id=si.product_id
    GROUP BY s.sale_id ORDER BY s.sale_date_time DESC`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.sale_id AS saleId,s.sale_date_time AS saleDateTime,s.payment_method AS paymentMethod,
    s.employee_id AS employeeId,e.employee_name AS employeeName,COALESCE(${totalExpr},0) AS totalAmount
    FROM sale s JOIN employee e ON e.employee_id=s.employee_id LEFT JOIN sale_item si ON si.sale_id=s.sale_id
    WHERE s.sale_id=? GROUP BY s.sale_id`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "Sale not found" });
    const [items] = await pool.execute(
      `SELECT si.product_id AS productId,p.product_name AS productName,si.quantity,
    si.sale_unit_price AS saleUnitPrice,si.discount_amount AS discountAmount
    FROM sale_item si JOIN product p ON p.product_id=si.product_id WHERE si.sale_id=?`,
      [req.params.id],
    );
    res.json({ ...rows[0], items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sale" });
  }
});
router.post("/", async (req, res) => {
  const { employeeId, paymentMethod, items } = req.body || {};
  if (
    !Number.isInteger(Number(employeeId)) ||
    Number(employeeId) < 1 ||
    typeof paymentMethod !== "string" ||
    !paymentMethod.trim() ||
    !Array.isArray(items) ||
    !items.length ||
    items.some(
      (i) =>
        !Number.isInteger(Number(i.productId)) ||
        Number(i.productId) < 1 ||
        !Number.isInteger(Number(i.quantity)) ||
        Number(i.quantity) < 1,
    )
  )
    return res
      .status(400)
      .json({
        error:
          "Provide employeeId, paymentMethod, and sale items with positive productId and quantity",
      });
  const byProduct = new Map();
  for (const i of items) {
    const id = Number(i.productId),
      prev = byProduct.get(id) || {
        productId: id,
        quantity: 0,
        discountAmount: 0,
      };
    prev.quantity += Number(i.quantity);
    prev.discountAmount += Number(i.discountAmount || 0);
    byProduct.set(id, prev);
  }
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [employee] = await c.execute(
      "SELECT employee_id FROM employee WHERE employee_id=?",
      [Number(employeeId)],
    );
    if (!employee.length) {
      await c.rollback();
      return res.status(400).json({ error: "Employee does not exist" });
    }
    const saleItems = [];
    for (const item of byProduct.values()) {
      const [rows] = await c.execute(
        `SELECT p.product_name,p.unit_price,i.quantity_in_stock FROM product p JOIN inventory i USING(product_id) WHERE p.product_id=? FOR UPDATE`,
        [item.productId],
      );
      if (!rows.length)
        throw Object.assign(new Error("Product not found"), { status: 400 });
      if (rows[0].quantity_in_stock < item.quantity)
        throw Object.assign(
          new Error("Insufficient stock for " + rows[0].product_name),
          { status: 409 },
        );
      const price = Number(rows[0].unit_price),
        discount = Number(item.discountAmount);
      if (
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > price * item.quantity
      )
        throw Object.assign(new Error("Invalid discount amount"), {
          status: 400,
        });
      saleItems.push({
        ...item,
        saleUnitPrice: price,
        discountAmount: discount,
      });
    }
    const [s] = await c.execute(
      "INSERT INTO sale(sale_date_time,payment_method,employee_id) VALUES(NOW(),?,?)",
      [paymentMethod.trim(), Number(employeeId)],
    );
    for (const i of saleItems) {
      await c.execute(
        "INSERT INTO sale_item(sale_id,product_id,quantity,sale_unit_price,discount_amount) VALUES(?,?,?,?,?)",
        [
          s.insertId,
          i.productId,
          i.quantity,
          i.saleUnitPrice,
          i.discountAmount,
        ],
      );
      await c.execute(
        "UPDATE inventory SET quantity_in_stock=quantity_in_stock-?,last_updated=NOW() WHERE product_id=?",
        [i.quantity, i.productId],
      );
    }
    await c.commit();
    res
      .status(201)
      .json({
        saleId: s.insertId,
        employeeId: Number(employeeId),
        paymentMethod: paymentMethod.trim(),
        saleDateTime: new Date().toISOString(),
        totalAmount: Number(
          saleItems
            .reduce(
              (n, i) => n + i.quantity * i.saleUnitPrice - i.discountAmount,
              0,
            )
            .toFixed(2),
        ),
        items: saleItems,
      });
  } catch (e) {
    await c.rollback();
    console.error(e);
    res
      .status(e.status || 500)
      .json({ error: e.status ? e.message : "Failed to record sale" });
  } finally {
    c.release();
  }
});
module.exports = router;
