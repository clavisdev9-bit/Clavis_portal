import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_so_summary=async(req,res)=>{
    let query = 'SELECT * FROM so_summaries';
    const result = await pool.query(query);
    res.json(result.rows);
}