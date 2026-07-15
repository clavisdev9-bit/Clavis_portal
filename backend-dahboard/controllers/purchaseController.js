import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;
export const get_purchase = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        let query = `SELECT * FROM purchase_orders`;
        const conditions = [];
        const values = [];

        if (date_from) {
            values.push(date_from);
            conditions.push(`write_date >= $${values.length}`);
        }

        if (date_to) {
            values.push(date_to);
            // Mengambil seluruh data hingga akhir tanggal yang dipilih
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
export const get_total_purchase=async(req, res)=>{
    let query = 'SELECT COUNT(id) AS total_purchase FROM purchase_orders';
    const result = await pool.query(query);
    res.json(result.rows);
}
export const get_total_amount=async(req, res)=>{
    let query = 'SELECT SUM(COALESCE(amount_total, 0)) AS total_amount FROM purchase_orders';
    const result = await pool.query(query);
    res.json(result.rows);
}
export const get_total_tax=async(req, res)=>{
    let query = 'SELECT SUM(COALESCE(amount_tax, 0)) AS total_tax FROM purchase_orders';
    const result = await pool.query(query);
    res.json(result.rows);
}
export const get_number_of_item=async(req, res)=>{
    let query = 'SELECT SUM(cardinality(order_line)) AS total_item_count FROM purchase_orders';
    const result = await pool.query(query);
    res.json(result.rows);
}
export const get_purchase_invoice=async(req,res)=>{
    let query=`SELECT COUNT(id) AS purchase_to_invoice FROM purchase_orders WHERE invoice_status = 'to invoice'`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_purchase_trend=async(req,res)=>{
    let query=`SELECT DATE_TRUNC('month', date_order) AS month, TO_CHAR(DATE_TRUNC('month', date_order), 'Mon YYYY') AS month_year, SUM(amount_total) AS monthly_purchase FROM purchase_orders GROUP BY month ORDER BY month`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_top_supplier=async(req,res)=>{
    let query=`SELECT partner_id[1], SUM(amount_total) AS total_purchase FROM purchase_orders GROUP BY partner_id[1] ORDER BY total_purchase DESC LIMIT 10`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_sales_person=async(req,res)=>{
    let query=`SELECT create_uid[1], SUM(amount_total) AS total_purchase FROM purchase_orders GROUP BY create_uid[1]`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const truncateInsert=async(req,res)=>{
    const response = await fetch(
        `${BASE_URL}/clavis_connect/purchase/GetPurchaseOrder`
    );

    if (!response.ok) {
        return res.status(response.status).json({
            message: "Gagal mengambil data dari API external",
        });
    }

    const api = await response.json();
    const rows = api?.data ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "Data kosong" });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1️⃣ TRUNCATE TABLE
        await client.query(`TRUNCATE TABLE purchase_orders RESTART IDENTITY`);
        for (const r of rows) {
            const toJsonArray = (v) => {
                if (v === null || v === undefined) return null;

                // jika sudah array objekt js → stringify
                if (Array.isArray(v) || typeof v === "object") {
                    return JSON.stringify(v);
                }

                // jika format string {2,"Name"} → perbaiki jadi ["2","Name"]
                if (typeof v === "string") {
                    const fixed = v
                    .replace(/^{/, "[")
                    .replace(/}$/, "]")
                    .replace(/""/g, '"');

                    try {
                    return JSON.stringify(JSON.parse(fixed));
                    } catch {
                    return JSON.stringify([]);
                    }
                }

                return JSON.stringify(v);
            };
            await client.query(
                `INSERT INTO purchase_orders (
                id,
                access_url,
                amount_tax,
                amount_total,
                amount_total_cc,
                amount_untaxed,
                company_currency_id,
                company_id,
                company_price_include,
                country_code,
                create_date,
                create_uid,
                currency_id,
                currency_rate,
                date_approve,
                date_calendar_start,
                date_order,
                date_planned,
                default_location_dest_id_usage,
                display_name,
                invoice_status,
                name,
                order_line,
                partner_id,
                partner_ref,
                payment_term_id,
                picking_type_id,
                product_id,
                tax_country_id,
                user_id,
                write_date,
                write_uid
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,
                    $11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,$19,$20,
                    $21,$22,$23,$24::jsonb,$25,$26::jsonb,$27::jsonb,$28::jsonb,$29::jsonb,$30::jsonb,
                    $31,$32::jsonb
                )`,
                [
                    r.id,
                    r.access_url,
                    r.amount_tax,
                    r.amount_total,
                    r.amount_total_cc,
                    r.amount_untaxed,
                    toJsonArray(r.company_currency_id),
                    toJsonArray(r.company_id),
                    r.company_price_include,
                    r.country_code,
                    r.create_date ? new Date(r.create_date) : null,
                    toJsonArray(r.create_uid),
                    toJsonArray(r.currency_id),
                    r.currency_rate,
                    r.date_approve ? new Date(r.date_approve) : null,
                    r.date_calendar_start ? new Date(r.date_calendar_start) : null,
                    r.date_order ? new Date(r.date_order) : null,
                    r.date_planned ? new Date(r.date_planned) : null,
                    r.default_location_dest_id_usage,
                    r.display_name,
                    r.invoice_status,
                    r.name,
                    [r.order_line],
                    toJsonArray(r.partner_id),
                    r.partner_ref,
                    toJsonArray(r.payment_term_id),
                    toJsonArray(r.picking_type_id),
                    toJsonArray(r.product_id),
                    toJsonArray(r.tax_country_id),
                    toJsonArray(r.user_id),
                    r.write_date ? new Date(r.write_date) : null,
                    toJsonArray(r.write_uid)
                ]
            );
        }
        await client.query("COMMIT");

        console.log({
            message: "SYNC SUCCESS — truncate & insert purchase orders table",
            inserted: rows.length,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("DB Error:", err);
    } finally {
        client.release();
    }
}