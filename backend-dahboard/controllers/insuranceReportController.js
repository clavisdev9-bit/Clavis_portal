import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_insurance_report=async(req,res)=>{
    let query = 'SELECT * FROM insurance_reports';
    const result = await pool.query(query);
    res.json(result.rows);
}