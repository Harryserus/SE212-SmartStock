const express=require("express");
const pool=require("../db");
const router=express.Router();
const dateRange=(req,res)=>{
  const {startDate,endDate}=req.query;
  const valid=v=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v)));
  if(!valid(startDate)||!valid(endDate)) { res.status(400).json({error:"Dates must use YYYY-MM-DD"}); return null; }
  if(startDate&&endDate&&startDate>endDate) { res.status(400).json({error:"startDate must not be after endDate"}); return null; }
  return [startDate||null,endDate||null];
};
router.get("/overview",async(req,res)=>{
  try{
    const [[sales]]=await pool.query(`SELECT COUNT(DISTINCT s.sale_id) AS transactions,
      COALESCE(SUM(si.quantity*si.sale_unit_price-COALESCE(si.discount_amount,0)),0) AS revenue
      FROM sale s LEFT JOIN sale_item si ON si.sale_id=s.sale_id WHERE DATE(s.sale_date_time)=CURDATE()`);
    const [[stock]]=await pool.query("SELECT COUNT(*) AS lowStock FROM inventory WHERE quantity_in_stock<=reorder_level");
    res.json({todayRevenue:Number(sales.revenue),todayTransactions:Number(sales.transactions),lowStockProducts:Number(stock.lowStock)});
  }catch(e){console.error(e);res.status(500).json({error:"Failed to fetch overview"});}
});
router.get("/recommendations",async(req,res)=>{
  try{const [rows]=await pool.query(`SELECT p.product_id AS productId,p.product_name AS productName,
    i.quantity_in_stock AS quantityInStock,i.reorder_level AS reorderLevel
    FROM inventory i JOIN product p USING(product_id) WHERE i.quantity_in_stock<=i.reorder_level ORDER BY i.quantity_in_stock`);res.json(rows);}
  catch(e){console.error(e);res.status(500).json({error:"Failed to fetch low-stock recommendations"});}
});
router.get("/top-products",async(req,res)=>{
  const dates=dateRange(req,res);if(!dates)return;
  try{const [rows]=await pool.query(`SELECT p.product_id AS productId,p.product_name AS productName,
    SUM(si.quantity) AS quantitySold,SUM(si.quantity*si.sale_unit_price-COALESCE(si.discount_amount,0)) AS salesRevenue
    FROM sale_item si JOIN sale s USING(sale_id) JOIN product p USING(product_id)
    WHERE DATE(s.sale_date_time)>=COALESCE(?,DATE_SUB(CURDATE(),INTERVAL 30 DAY))
      AND DATE(s.sale_date_time)<=COALESCE(?,CURDATE())
    GROUP BY p.product_id,p.product_name ORDER BY quantitySold DESC LIMIT 10`,dates);res.json(rows);}
  catch(e){console.error(e);res.status(500).json({error:"Failed to fetch best-selling products"});}
});
router.get("/slow-products",async(req,res)=>{
  const dates=dateRange(req,res);if(!dates)return;
  try{const [rows]=await pool.query(`SELECT p.product_id AS productId,p.product_name AS productName,
    COALESCE(SUM(CASE WHEN s.sale_id IS NOT NULL THEN si.quantity ELSE 0 END),0) AS quantitySold
    FROM product p LEFT JOIN sale_item si USING(product_id) LEFT JOIN sale s
    ON s.sale_id=si.sale_id
    AND DATE(s.sale_date_time)>=COALESCE(?,DATE_SUB(CURDATE(),INTERVAL 30 DAY))
    AND DATE(s.sale_date_time)<=COALESCE(?,CURDATE())
    GROUP BY p.product_id,p.product_name ORDER BY quantitySold ASC,p.product_name LIMIT 10`,dates);res.json(rows);}
  catch(e){console.error(e);res.status(500).json({error:"Failed to fetch slow-moving products"});}
});
router.get("/supplier-issues",async(req,res)=>{
  try{const [rows]=await pool.query(`SELECT i.issue_id AS issueId,i.purchase_order_id AS purchaseOrderId,s.supplier_name AS supplierName,i.issue_type AS issueType,
    i.description,i.issue_date AS issueDate,i.status,i.resolved_date AS resolvedDate
    FROM supplier_issue i JOIN purchase_order po ON po.purchase_order_id=i.purchase_order_id
    JOIN supplier s ON s.supplier_id=po.supplier_id ORDER BY i.issue_date DESC`);res.json(rows);}
  catch(e){console.error(e);res.status(500).json({error:"Failed to fetch supplier issues"});}
});
module.exports=router;
