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