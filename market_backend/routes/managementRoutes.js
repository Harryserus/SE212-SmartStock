
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET dashboard overview
router.get("/overview", async (req, res) => {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        COALESCE(SUM(
          CASE WHEN DATE(sale_date) = CURDATE()
          THEN total_amount ELSE 0 END
        ), 0) AS todayRevenue,
        SUM(
          CASE WHEN DATE(sale_date) = CURDATE()
          THEN 1 ELSE 0 END
        ) AS todayTransactions
      FROM sale
    `);

    const [[stockSummary]] = await pool.query(`
      SELECT
        SUM(CASE
          WHEN i.quantity <= p.reorder_level THEN 1
          ELSE 0
        END) AS lowStockProducts
      FROM product p
      JOIN inventory i ON i.product_id = p.product_id
    `);

    res.json({
      todayRevenue: Number(summary.todayRevenue),
      todayTransactions: Number(summary.todayTransactions),
      lowStockProducts: Number(stockSummary.lowStockProducts || 0),
      productsToPurchase: Number(stockSummary.lowStockProducts || 0)
    });
  } catch (error) {
    console.error("Management overview error:", error);
    res.status(500).json({ error: "Failed to fetch management overview" });
  }
});

// GET purchase recommendations
router.get("/recommendations", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_id AS productId,
        p.product_name AS productName,
        i.quantity AS currentStock,
        p.reorder_level AS reorderLevel,
        COALESCE(s.soldLast30Days, 0) / 30.0 AS averageDailySales,
        GREATEST((p.reorder_level * 2) - i.quantity, 0)
          AS recommendedQuantity,
        'LOW_STOCK' AS reason
      FROM product p
      JOIN inventory i ON i.product_id = p.product_id
      LEFT JOIN (
        SELECT
          si.product_id,
          SUM(si.quantity) AS soldLast30Days
        FROM sale_item si
        JOIN sale s ON s.sale_id = si.sale_id
        WHERE s.sale_date >= CURRENT_DATE - INTERVAL 30 DAY
        GROUP BY si.product_id
      ) s ON s.product_id = p.product_id
      WHERE i.quantity <= p.reorder_level
      ORDER BY i.quantity ASC
    `);

    res.json(rows.map(row => ({
      ...row,
      currentStock: Number(row.currentStock),
      reorderLevel: Number(row.reorderLevel),
      averageDailySales: Number(row.averageDailySales),
      recommendedQuantity: Number(row.recommendedQuantity)
    })));
  } catch (error) {
    console.error("Purchase recommendations error:", error);
    res.status(500).json({
      error: "Failed to fetch purchase recommendations"
    });
  }
});

// GET top-selling products over the last 30 days
router.get("/top-products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_id AS productId,
        p.product_name AS productName,
        SUM(si.quantity) AS quantitySold,
        SUM(si.subtotal) AS salesRevenue
      FROM sale_item si
      JOIN sale s ON s.sale_id = si.sale_id
      JOIN product p ON p.product_id = si.product_id
      WHERE s.sale_date >= CURRENT_DATE - INTERVAL 30 DAY
      GROUP BY p.product_id, p.product_name
      ORDER BY quantitySold DESC, salesRevenue DESC
      LIMIT 10
    `);

    res.json(rows.map(row => ({
      ...row,
      quantitySold: Number(row.quantitySold),
      salesRevenue: Number(row.salesRevenue)
    })));
  } catch (error) {
    console.error("Top products error:", error);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
});

// GET slow-selling products over the last 30 days
router.get("/slow-products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_id AS productId,
        p.product_name AS productName,
        COALESCE(SUM(CASE WHEN s.sale_id IS NOT NULL THEN si.quantity 
		ELSE 0 END
	), 0) AS quantitySold,
	COALESCE(SUM(
  	CASE WHEN s.sale_id IS NOT NULL THEN si.subtotal ELSE 0 END
	), 0) AS salesRevenue
      FROM product p
      LEFT JOIN sale_item si ON si.product_id = p.product_id
      LEFT JOIN sale s
        ON s.sale_id = si.sale_id
        AND s.sale_date >= CURRENT_DATE - INTERVAL 30 DAY
      GROUP BY p.product_id, p.product_name
      ORDER BY quantitySold ASC, p.product_name ASC
      LIMIT 10
    `);

    res.json(rows.map(row => ({
      ...row,
      quantitySold: Number(row.quantitySold),
      salesRevenue: Number(row.salesRevenue)
    })));
  } catch (error) {
    console.error("Slow products error:", error);
    res.status(500).json({ error: "Failed to fetch slow products" });
  }
});

module.exports = router;

