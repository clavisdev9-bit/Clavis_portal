import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_inventory_balances=async(req,res)=>{
    let query = 'SELECT * FROM inventory_balances';
    const result = await pool.query(query);
    res.json(result.rows);
}