const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/", async (req,res) => {
  try { const [rows] = await pool.query(`SELECT p.product_id AS productId,p.product_name AS productName,
    i.quantity_in_stock AS quantityInStock,i.reorder_level AS reorderLevel,i.last_updated AS lastUpdated,
    (i.quantity_in_stock <= i.reorder_level) AS lowStock
    FROM inventory i JOIN product p ON p.product_id=i.product_id ORDER BY p.product_name`); res.json(rows); }
  catch(e) { console.error(e); res.status(500).json({error:"Failed to fetch inventory"}); }
});
router.get("/low-stock", async(req,res) => {
  try { const [rows] = await pool.query(`SELECT p.product_id AS productId,p.product_name AS productName,
    i.quantity_in_stock AS quantityInStock,i.reorder_level AS reorderLevel
    FROM inventory i JOIN product p ON p.product_id=i.product_id
    WHERE i.quantity_in_stock <= i.reorder_level ORDER BY i.quantity_in_stock`); res.json(rows); }
  catch(e) { console.error(e); res.status(500).json({error:"Failed to fetch low-stock products"}); }
});
router.put("/:productId", async(req,res) => {
  const q=Number(req.body?.quantityInStock), level=Number(req.body?.reorderLevel);
  if(!Number.isInteger(q)||q<0||!Number.isInteger(level)||level<0) return res.status(400).json({error:"quantityInStock and reorderLevel must be non-negative integers"});
  try { const [r]=await pool.execute("UPDATE inventory SET quantity_in_stock=?,reorder_level=?,last_updated=NOW() WHERE product_id=?",[q,level,req.params.productId]);
    if(!r.affectedRows) return res.status(404).json({error:"Inventory record not found"});
    res.json({productId:Number(req.params.productId),quantityInStock:q,reorderLevel:level}); }
  catch(e){console.error(e);res.status(500).json({error:"Failed to update inventory"});}
});
router.post("/stock-in", async(req,res) => {
  const productId=Number(req.body?.productId), quantity=Number(req.body?.quantity);
  if(!Number.isInteger(productId)||productId<1||!Number.isInteger(quantity)||quantity<1) return res.status(400).json({error:"productId and positive integer quantity are required"});
  try { const [r]=await pool.execute("UPDATE inventory SET quantity_in_stock=quantity_in_stock+?,last_updated=NOW() WHERE product_id=?",[quantity,productId]);
    if(!r.affectedRows) return res.status(404).json({error:"Inventory record not found"});
    const [[row]]=await pool.execute("SELECT quantity_in_stock AS quantityInStock FROM inventory WHERE product_id=?",[productId]);
    res.json({productId,quantityInStock:row.quantityInStock}); }
  catch(e){console.error(e);res.status(500).json({error:"Failed to add stock"});}
});
module.exports=router;
