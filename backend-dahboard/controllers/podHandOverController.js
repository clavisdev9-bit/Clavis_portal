import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_pod_hand_over=async(req,res)=>{
    let query = 'SELECT * FROM pod_hand_over';
    const result = await pool.query(query);
    res.json(result.rows);
}