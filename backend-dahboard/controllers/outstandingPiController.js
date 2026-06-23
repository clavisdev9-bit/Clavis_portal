import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_outstanding_pi=async(req,res)=>{
    let query = 'SELECT * FROM outstanding_pi';
    const result = await pool.query(query);
    res.json(result.rows);
}