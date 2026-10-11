
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all categories
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT category_id AS categoryId,
              category_name AS categoryName
       FROM category
       ORDER BY category_id`
    );

    res.json(rows);
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
});

// CREATE a category
router.post("/", async (req, res) => {
  const categoryName = req.body.categoryName?.trim();

  if (!categoryName) {
    return res.status(400).json({
      error: "categoryName is required"
    });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO category (category_name) VALUES (?)",
      [categoryName]
    );

    res.status(201).json({
      categoryId: result.insertId,
      categoryName
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Category already exists"
      });
    }

    console.error("Failed to create category:", error.message);

    res.status(500).json({
      error: "Failed to create category"
    });
  }
});

module.exports = router;

