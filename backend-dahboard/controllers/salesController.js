import pool from '../db.js';
export const get_sales = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        let query = `SELECT * FROM sales_orders`;
        const conditions = [];
        const values = [];

        // Filter company
        // Filter tanggal mulai
        if (date_from) {
            values.push(date_from);
            conditions.push(`write_date >= $${values.length}`);
        }

        // Filter tanggal akhir (termasuk seluruh hari)
        if (date_to) {
            values.push(date_to);
            conditions.push(`write_date < ($${values.length}::date + interval '1 day')`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }

        query += ` ORDER BY write_date DESC`;

        const result = await pool.query(query, values);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
export const get_total_sales=async(req, res)=>{
    let query = 'SELECT SUM(COALESCE(amount_total, 0)) AS total_amount FROM sales_orders';
    const result = await pool.query(query);
    res.json(result.rows);
}
export const get_total_orders=async(req,res)=>{
    let query=`SELECT COUNT(id) AS total_orders FROM sales_orders`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_average_order=async(req,res)=>{
    let query=`SELECT AVG(amount_total) AS avg_order_value FROM sales_orders`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_total_margin=async(req,res)=>{
    let query=`SELECT SUM(margin) AS total_margin FROM sales_orders`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_total_unpaid=async(req,res)=>{
    let query=`SELECT SUM(amount_unpaid) AS total_unpaid FROM sales_orders`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_margin_percent=async(req,res)=>{
    let query=`SELECT (SUM(margin) / NULLIF(SUM(amount_total),0)) * 100 AS margin_percent FROM sales_orders`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_delivery_full=async(req,res)=>{
    let query=`SELECT COUNT(id) AS order_delivery_full FROM sales_orders WHERE delivery_status = 'full'`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_sales_trend=async(req,res)=>{
    let query=`SELECT DATE_TRUNC('month', date_order) AS month, TO_CHAR(DATE_TRUNC('month', date_order), 'Mon YYYY') AS month_year, SUM(amount_total) AS monthly_sales FROM sales_orders GROUP BY month ORDER BY month`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_top_customers=async(req,res)=>{
    let query=`SELECT partner_id[1],
    SUM(amount_total) AS total_sales
    FROM sales_orders
    GROUP BY partner_id[1]
    ORDER BY total_sales DESC
    LIMIT 10`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_sales_person=async(req,res)=>{
    let query=`SELECT create_uid[1], SUM(amount_total) AS total_sales FROM sales_orders GROUP BY create_uid[1]`;
    const result=await pool.query(query);
    res.json(result.rows);
}