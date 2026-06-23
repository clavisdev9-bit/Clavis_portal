import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_mti_statutory_sales=async(req,res)=>{
    let query = 'SELECT * FROM mti_statutory_sales';
    const result = await pool.query(query);
    res.json(result.rows);
}