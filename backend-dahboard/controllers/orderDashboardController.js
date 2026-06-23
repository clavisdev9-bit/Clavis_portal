import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_order_dashboard=async(req,res)=>{
    let query = 'SELECT * FROM order_dashboard';
    const result = await pool.query(query);
    res.json(result.rows);
}