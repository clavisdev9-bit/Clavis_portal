import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_sell_out_customers=async(req,res)=>{
    let query = 'SELECT * FROM sell_out_customers';
    const result = await pool.query(query);
    res.json(result.rows);
}