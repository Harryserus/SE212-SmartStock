const express=require("express");
const pool=require("../db");
const router=express.Router();
router.get("/",async(req,res)=>{try{const [r]=await pool.query(`SELECT issue_id AS issueId,purchase_order_id AS purchaseOrderId,employee_id AS employeeId,issue_type AS issueType,description,issue_date AS issueDate,status,resolved_date AS resolvedDate FROM supplier_issue ORDER BY issue_date DESC`);res.json(r);}catch(e){console.error(e);res.status(500).json({error:"Failed to fetch supplier issues"});}});
router.post("/",async(req,res)=>{
  const {purchaseOrderId,employeeId,issueType,description}=req.body||{};
  if(!Number.isInteger(Number(purchaseOrderId))||!Number.isInteger(Number(employeeId))||
     typeof issueType!=="string"||!issueType.trim())
    return res.status(400).json({error:"Provide purchaseOrderId, employeeId, and issueType"});
  try{
    const [r]=await pool.execute("INSERT INTO supplier_issue(purchase_order_id,employee_id,issue_type,description,issue_date) VALUES(?,?,?,?,NOW())",
      [purchaseOrderId,employeeId,issueType.trim(),description||null]);
    res.status(201).json({issueId:r.insertId,status:"open"});
  }catch(e){
    console.error(e);
    res.status(400).json({error:"Could not create issue; check purchase order and employee"});
  }
});
router.patch("/:id/status",async(req,res)=>{const status=String(req.body?.status||"");if(!["open","in_progress","resolved","closed"].includes(status))return res.status(400).json({error:"Invalid issue status"});try{const [r]=await pool.execute("UPDATE supplier_issue SET status=?,resolved_date=? WHERE issue_id=?",[status,status==="resolved"||status==="closed"?new Date():null,req.params.id]);if(!r.affectedRows)return res.status(404).json({error:"Supplier issue not found"});res.json({message:"Issue status updated",status});}catch(e){console.error(e);res.status(500).json({error:"Failed to update issue"});}});
module.exports=router;
