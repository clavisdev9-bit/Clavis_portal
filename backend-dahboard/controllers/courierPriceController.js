import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_courier_price=async(req,res)=>{
    let query = 'SELECT * FROM courier_price_lists';
    const result = await pool.query(query);
    res.json(result.rows);
}