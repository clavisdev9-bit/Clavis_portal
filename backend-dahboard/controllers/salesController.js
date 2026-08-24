import pool from '../db.js';
import dayjs from 'dayjs';
const BASE_URL=process.env.CLAVIS_BASE_URL;
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
export const get_sales_stats_ytd = async (req, res) => {
    try {
        const { company_id } = req.query;
        const values = [];
        const conditions = [];

        if (company_id) {
            const parsedId = Number(company_id);
            if (isNaN(parsedId)) {
                return res.status(400).json({ error: "company_id harus berupa angka" });
            }
            values.push(parsedId);
            conditions.push(`(company_id->>0)::integer = $${values.length}`);
        }

        const extraWhere = conditions.length > 0
            ? `AND ${conditions.join(' AND ')}`
            : '';

        const query = `
            WITH agregat AS (
                SELECT 
                    DATE_TRUNC('month', date_order) AS bulan_urut,
                    SUM(amount_total)                 AS total_bulan
                FROM sales_orders
                WHERE (
                        (date_order <= CURRENT_DATE 
                        AND date_order >= DATE_TRUNC('year', CURRENT_DATE))
                        OR
                        (date_order <= CURRENT_DATE - INTERVAL '1 year' 
                        AND date_order >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year')
                    )
                ${extraWhere}
                GROUP BY DATE_TRUNC('month', date_order)
            ),
            data AS (
                SELECT 
                    bulan_urut,
                    EXTRACT(YEAR FROM bulan_urut)  AS tahun,
                    EXTRACT(MONTH FROM bulan_urut) AS bulan_num,
                    total_bulan
                FROM agregat
            ),
            running AS (
                SELECT 
                    *,
                    SUM(total_bulan) OVER (PARTITION BY tahun ORDER BY bulan_urut) AS running_total
                FROM data
            )
            SELECT 
                CASE bulan_num
                    WHEN 1  THEN 'Januari'
                    WHEN 2  THEN 'Februari'
                    WHEN 3  THEN 'Maret'
                    WHEN 4  THEN 'April'
                    WHEN 5  THEN 'Mei'
                    WHEN 6  THEN 'Juni'
                    WHEN 7  THEN 'Juli'
                    WHEN 8  THEN 'Agustus'
                    WHEN 9  THEN 'September'
                    WHEN 10 THEN 'Oktober'
                    WHEN 11 THEN 'November'
                    WHEN 12 THEN 'Desember'
                END || ' ' || tahun AS bulan,
                running_total AS total
            FROM running
            ORDER BY bulan_num, tahun;
        `;
        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error("get_sales_report_ytd error:", error);

        res.status(500).json({
            error: "Failed to get report ytd",
            message: error.message
        });
    }

};
export const get_total_sales = async (req, res) => {
    try {
        const {
            date_from,
            date_to,
            filter_type
        } = req.query;

        let query = `
            SELECT
                COALESCE(
                    SUM(amount_total),
                    0
                ) AS total_amount,

                COUNT(id) AS total_orders,

                COALESCE(
                    AVG(amount_total),
                    0
                ) AS avg_order_value,

                COALESCE(
                    SUM(margin),
                    0
                ) AS total_margin,

                COALESCE(
                    SUM(amount_unpaid),
                    0
                ) AS total_unpaid,

                COALESCE(
                    (
                        SUM(margin)
                        /
                        NULLIF(
                            SUM(amount_total),
                            0
                        )
                    ) * 100,
                    0
                ) AS margin_percent
        `;

        // Hanya tambahkan previous month
        // jika filter yang digunakan adalah month
        if (
            filter_type === "month" &&
            date_from &&
            date_to
        ) {
            query += `,
                COALESCE(
                    (
                        SELECT SUM(previous.amount_total)
                        FROM sales_orders previous
                        WHERE previous.date_order >=
                            ($1::date - INTERVAL '1 month')
                        AND previous.date_order <
                            $1::date
                    ),
                    0
                ) AS previous_month_total_amount,

                COALESCE(
                    (
                        SELECT COUNT(previous.id)
                        FROM sales_orders previous
                        WHERE previous.date_order >=
                            ($1::date - INTERVAL '1 month')
                        AND previous.date_order <
                            $1::date
                    ),
                    0
                ) AS previous_month_total_orders,

                COALESCE(
                    (
                        SELECT AVG(previous.amount_total)
                        FROM sales_orders previous
                        WHERE previous.date_order >=
                            ($1::date - INTERVAL '1 month')
                        AND previous.date_order <
                            $1::date
                    ),
                    0
                ) AS previous_month_avg_order
            `;
        } else {
            query += `,
                0 AS previous_month_total_amount,
                0 AS previous_month_total_orders,
                0 AS previous_month_avg_order
            `;
        }

        query += `
            FROM sales_orders
        `;

        const conditions = [];
        const values = [];

        if (date_from) {
            values.push(date_from);

            conditions.push(
                `date_order >= $${values.length}::date`
            );
        }

        if (date_to) {
            values.push(date_to);

            conditions.push(
                `date_order < $${values.length}::date`
            );
        }

        if (conditions.length > 0) {
            query += `
                WHERE ${conditions.join(" AND ")}
            `;
        }

        const result = await pool.query(
            query,
            values
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
export const get_company_orders = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id,
            partner_id,
            invoice_status
        } = req.query;
        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator <
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }
        if (partner_id) {
            values.push(Number(partner_id));

            conditions.push(
                `(partner_id->>0)::integer = $${values.length}`
            );
        }
        if (invoice_status) {
            values.push(invoice_status);

            conditions.push(
                `invoice_status = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";
        /*
         * ==========================================
         * QUERY TOP CUSTOMERS
         * ==========================================
         */

        const query = `
            select date_order,delivery_date,partner_id->>1 customer_name,amount_total,amount_tax,order_line,invoice_status,delivery_status from sales_orders ${whereClause} AND amount_total>0
        `;
        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_company_sales_orders error:", error);

        res.status(500).json({
            error: "Failed to get company sales orders",
            message: error.message
        });
    }
};
export const get_total_orders=async(req,res)=>{
    let query=`SELECT COUNT(id) AS total_orders FROM sales_orders`;
    const result=await pool.query(query);
    res.json(result.rows);
}
export const get_active_customers=async(req,res)=>{
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator <
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY TOP CUSTOMERS
         * ==========================================
         */

        const query = `
            SELECT
            (SELECT COUNT(*) FROM (
                SELECT partner_id
                FROM sales_orders
                WHERE company_id->>0 = '2'
                GROUP BY partner_id
                HAVING SUM(amount_total) <> 0
            ) t1) AS total_customer,

            (SELECT COUNT(*) FROM (
                SELECT partner_id
                FROM sales_orders
                ${whereClause}
                GROUP BY partner_id
                HAVING SUM(amount_total) <> 0
            ) t2) AS active_customer
        `;
        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error("get_top_customers error:", error);

        res.status(500).json({
            error: "Failed to get top customers",
            message: error.message
        });
    }
}
export const get_invoice_progress=async(req,res)=>{
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator <
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY TOP CUSTOMERS
         * ==========================================
         */

        const query = `
            SELECT
                COUNT(*) FILTER (WHERE invoice_status = 'invoiced')   AS invoiced,
                COUNT(*) FILTER (WHERE invoice_status = 'no')         AS no,
                COUNT(*) FILTER (WHERE invoice_status = 'to invoice') AS to_invoice,
                ROUND(
                    100.0 * COUNT(*) FILTER (WHERE invoice_status = 'invoiced')
                    / NULLIF(
                        COUNT(*) FILTER (WHERE invoice_status = 'invoiced')
                        + COUNT(*) FILTER (WHERE invoice_status = 'to invoice'),
                        0
                    ),
                    2
                ) AS percentage_invoiced
            FROM sales_orders
            ${whereClause}
        `;
        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error("get_invoice_progress error:", error);

        res.status(500).json({
            error: "Failed to get top customers",
            message: error.message
        });
    }
}
export const get_order_fullfilment=async(req,res)=>{
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator <
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY TOP CUSTOMERS
         * ==========================================
         */
        const query = `
            SELECT 
                delivery_status,
                SUM(amount_total) AS total_amount,
                ROUND(
                    SUM(amount_total) * 100.0 / SUM(SUM(amount_total)) OVER (), 
                    2
                ) AS percentage
            FROM sales_orders 
            ${whereClause}
            GROUP BY delivery_status
            HAVING SUM(amount_total) > 0;
        `;
        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error("get_order_fullfilment error:", error);

        res.status(500).json({
            error: "Failed to get order fullfilment",
            message: error.message
        });
    }
}
export const get_total_orders_by_company=async(req,res)=>{
    const { start_date, end_date, filter_type, company_id } = req.query;

    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }

    let query = `
        SELECT
            COUNT(id) AS total_order
        FROM sales_orders
    `;

    const values = [];
    const conditions = [];

    // Filter tanggal
    if (start_date && end_date) {
        values.push(start_date, end_date);

        conditions.push(
            `TO_CHAR(date_order,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
        );
    } else {
        conditions.push(`
            DATE(date_order) IN (
                SELECT DISTINCT DATE(date_order)
                FROM sales_orders
                ORDER BY DATE(date_order) DESC
                LIMIT 7
            )
        `);
    }

    // Filter company
    if (company_id) {
        values.push(company_id);

        conditions.push(
            `company_id[0] = $${values.length}`
        );
    }

    // Tambahkan WHERE
    if (conditions.length > 0) {
        query += `
            WHERE ${conditions.join(" AND ")}
        `;
    }

    const result = await pool.query(query, values);

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
export const first_last_date = async(req,res)=>{
    let query = `SELECT TO_CHAR(MIN(order_date), 'YYYY-MM-DD') AS first_date, TO_CHAR(MAX(order_date), 'YYYY-MM-DD') AS last_date FROM (SELECT DISTINCT DATE(date_order) AS order_date FROM sales_orders ORDER BY order_date DESC LIMIT 7) t;`;
    const result = await pool.query(query);
    res.json(result.rows);
}
export const get_delivery_full = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        let query = `
            SELECT 
                COUNT(id) AS order_delivery_full
            FROM sales_orders
            WHERE delivery_status = 'full'
        `;

        const conditions = [];
        const values = [];

        // Filter tanggal mulai
        if (date_from) {
            values.push(date_from);

            conditions.push(
                `date_order >= $${values.length}::date`
            );
        }

        // Filter tanggal akhir
        if (date_to) {
            values.push(date_to);

            conditions.push(
                `date_order < ($${values.length}::date + INTERVAL '1 day')`
            );
        }

        if (conditions.length > 0) {
            query += ` AND ` + conditions.join(" AND ");
        }

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Get Delivery Full Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
export const get_company_sales_stats = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                values.push(`${start_date}-01`);
                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            } else if (filter_type === "year") {
                values.push(`${start_date}-01-01`);
                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            } else {
                values.push(start_date);
                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                values.push(`${end_date}-01`);
                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );
            } else if (filter_type === "year") {
                values.push(`${end_date}-01-01`);
                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );
            } else {
                values.push(end_date);
                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(String(company_id));

            conditions.push(
                `company_id[0] = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY SALES STATS (PER TANGGAL & COMPANY)
         * ==========================================
         */

        const query = `
            SELECT
                TO_CHAR(date_order, 'YYYY-MM-DD') AS write_date,
                company_id[1] AS company,
                company_id[0] AS company_id,
                SUM(amount_total) AS total_amount

            FROM sales_orders

            ${whereClause}

            GROUP BY
                TO_CHAR(date_order, 'YYYY-MM-DD'),
                company_id[1],
                company_id[0]

            ORDER BY
                TO_CHAR(date_order, 'YYYY-MM-DD')
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_sales_stats error:", error);

        res.status(500).json({
            error: "Failed to get sales stats",
            message: error.message
        });
    }
};
export const get_sales_stats = async (req, res) => {
    const { start_date, end_date, filter_type, company_id, filter_by } = req.query;
    let selectField = `
        partner_id[1] AS label,
        SUM(amount_total) AS total_amount
    `;

    let groupField = `
        ,partner_id[1]
    `;

    let fromTable = `
        sales_orders
    `;

    let extraJoin = "";
    let totalAmountExpr = `SUM(amount_total)`;

    if (filter_by === "company") {
        selectField = `
            TO_CHAR(date_order,'YYYY-MM-DD') AS label,
            SUM(amount_total) AS total_amount
        `;
        groupField = `,date_order `;
        totalAmountExpr = `SUM(amount_total)`;
    }
    if (filter_by === "product") {
        selectField = `
            line->'product_template'->>'name' AS label,
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(jsonb_array_length(order_line), 0)
            ) AS total_amount
        `;
        groupField = `
            ,line->'product_template'->>'name'
        `;
        extraJoin = `
            CROSS JOIN LATERAL jsonb_array_elements(order_line) AS line
        `;
        totalAmountExpr = `
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(jsonb_array_length(order_line), 0)
            )
        `;
    }
    if (filter_by === "brand") {
        selectField = `
            line->'product_template'->'x_studio_brand'->>1 as label,
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(jsonb_array_length(order_line), 0)
            ) AS total_amount
        `;
        groupField = `
            ,line->'product_template'->'x_studio_brand'->>1
        `;
        extraJoin = `
            CROSS JOIN LATERAL jsonb_array_elements(order_line) AS line
        `;
        totalAmountExpr = `
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(jsonb_array_length(order_line), 0)
            )
        `;
    }
    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }

    // Jika start_date === end_date, cari tanggal sebelumnya yang punya data amount_total
    let effectiveStartDate = start_date;
    if (start_date && end_date && start_date === end_date) {
        const prevDateResult = await pool.query(
            `
            SELECT DATE(date_order) AS prev_date
            FROM sales_orders
            WHERE DATE(date_order) < $1
                AND amount_total > 0
            ORDER BY DATE(date_order) DESC
            LIMIT 1
            `,
            [start_date]
        );

        if (prevDateResult.rows.length > 0) {
            effectiveStartDate = dayjs(prevDateResult.rows[0].prev_date).format('YYYY-MM-DD');
        }
        // Jika tidak ada data sebelumnya sama sekali, biarkan effectiveStartDate = start_date (tidak berubah)
    }

    let query = `
        SELECT
            TO_CHAR(date_order,'${format}') AS write_date,
            company_id[1] company,
            company_id[0] company_id,
            ${selectField}
        FROM ${fromTable}
        ${extraJoin}
    `;

    const values = [];
    const conditions = [];

    if (effectiveStartDate && end_date) {
        values.push(effectiveStartDate, end_date);

        conditions.push(
            `TO_CHAR(date_order,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
        );
    } else {
        conditions.push(`
            DATE(date_order) IN (
                SELECT DISTINCT DATE(date_order)
                FROM sales_orders
                ORDER BY DATE(date_order) DESC
                LIMIT 7
            )
        `);
    }
    if (company_id) {
        values.push(company_id);

        conditions.push(
            `company_id[0] = $${values.length}`
        );
    }
    if (conditions.length > 0) {
        query += `
            WHERE ${conditions.join(" AND ")}
        `;
    }

    query += `
        GROUP BY
            TO_CHAR(date_order,'${format}'),
            company_id[1],
            company_id[0]
            ${groupField}
        HAVING ${totalAmountExpr} <> 0
        ORDER BY
            TO_CHAR(date_order,'${format}');
    `;
    const result = await pool.query(query, values);
    res.json(result.rows);
};
export const get_companies = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */


        /*
         * ==========================================
         * DEFAULT: 7 HARI TERAKHIR (kalau tanggal tidak diisi)
         * ==========================================
         */

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY COMPANIES
         * ==========================================
         */

        const query = `
            SELECT
                company_id

            FROM sales_orders

            ${whereClause}

            GROUP BY
                company_id

            ORDER BY
                company_id
        `;

        const result = await pool.query(query, values);

        return res.json(result.rows);

    } catch (error) {
        console.error("get_companies error:", error);

        return res.status(500).json({
            status: false,
            message: "Gagal mengambil data company",
            error: error.message
        });
    }
};
export const get_sales_trend = async (req, res) => {
    try {
        const {
            group_by = "month",
            start_date,
            end_date,
            customer_name
        } = req.query;

        let query;
        let params = [];

        // ========================================
        // CUSTOMER LIST
        // ========================================

        const customerQuery = `
            SELECT DISTINCT customer_name
            FROM sales_invoices
            WHERE customer_name IS NOT NULL
            AND TRIM(customer_name) <> ''
            ORDER BY customer_name
        `;

        const customerResult = await pool.query(
            customerQuery
        );

        const customers = customerResult.rows.map(
            row => row.customer_name
        );


        // ========================================
        // SALES FILTER
        // ========================================

        let whereConditions = [];
        let queryParams = [];

        // Filter tanggal hanya untuk group_by date
        if (
            group_by === "date" &&
            start_date &&
            end_date
        ) {
            queryParams.push(start_date);
            const startDateParam = `$${queryParams.length}`;

            queryParams.push(end_date);
            const endDateParam = `$${queryParams.length}`;

            whereConditions.push(
                `DATE(si_date) BETWEEN ${startDateParam} AND ${endDateParam}`
            );
        }


        // Filter customer
        if (customer_name) {
            queryParams.push(customer_name);
            const customerParam = `$${queryParams.length}`;

            whereConditions.push(
                `customer_name = ${customerParam}`
            );
        }


        // Gabungkan WHERE
        const whereClause =
            whereConditions.length > 0
                ? `WHERE ${whereConditions.join(" AND ")}`
                : "";


        // ========================================
        // GROUP BY DATE
        // ========================================

        if (group_by === "date") {

            query = `
                SELECT 
                    DATE(si_date) AS date,
                    TO_CHAR(
                        DATE(si_date),
                        'DD Mon YYYY'
                    ) AS date_label,
                    SUM(si_amt_bef_tax) AS total_sales
                FROM sales_invoices
                ${whereClause}
                GROUP BY DATE(si_date)
                ORDER BY DATE(si_date)
            `;


        // ========================================
        // GROUP BY YEAR
        // ========================================

        } else if (group_by === "year") {

            query = `
                SELECT 
                    DATE_TRUNC(
                        'year',
                        si_date
                    ) AS year,

                    TO_CHAR(
                        DATE_TRUNC(
                            'year',
                            si_date
                        ),
                        'YYYY'
                    ) AS year_label,

                    SUM(si_amt_bef_tax) AS total_sales

                FROM sales_invoices

                ${whereClause}

                GROUP BY DATE_TRUNC(
                    'year',
                    si_date
                )

                ORDER BY DATE_TRUNC(
                    'year',
                    si_date
                )
            `;


        // ========================================
        // GROUP BY MONTH
        // ========================================

        } else {

            query = `
                SELECT 
                    DATE_TRUNC(
                        'month',
                        si_date
                    ) AS month,

                    TO_CHAR(
                        DATE_TRUNC(
                            'month',
                            si_date
                        ),
                        'Mon YYYY'
                    ) AS month_year,

                    TO_CHAR(
                        DATE_TRUNC(
                            'month',
                            si_date
                        ),
                        'YYYY-MM'
                    ) AS year_month,

                    SUM(si_amt_bef_tax) AS total_sales

                FROM sales_invoices

                ${whereClause}

                GROUP BY DATE_TRUNC(
                    'month',
                    si_date
                )

                ORDER BY DATE_TRUNC(
                    'month',
                    si_date
                )
            `;
        }


        // ========================================
        // EXECUTE SALES QUERY
        // ========================================

        const result = await pool.query(
            query,
            queryParams
        );


        // ========================================
        // RESPONSE
        // ========================================

        res.json({
            customers: customers,
            sales: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to get sales trend"
        });
    }
};
export const get_top_customers = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator <
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY TOP CUSTOMERS
         * ==========================================
         */

        const query = `
            SELECT
                (company_id->>0)::integer AS company_id,
                company_id->>1 AS company_name,

                (partner_id->>0)::integer AS partner_id,
                partner_id->>1 AS customer_name,
                count(id) AS total_order,
                SUM(amount_total) AS total_amount,

                ROUND(
                    SUM(amount_total) * 100.0
                    / NULLIF(
                        SUM(SUM(amount_total)) OVER (),
                        0
                    ),
                    2
                ) AS percentage

            FROM sales_orders

            ${whereClause}

            GROUP BY
                (company_id->>0)::integer,
                company_id->>1,
                (partner_id->>0)::integer,
                partner_id->>1

            ORDER BY total_amount DESC

            LIMIT 10
        `;
        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_top_customers error:", error);

        res.status(500).json({
            error: "Failed to get top customers",
            message: error.message
        });
    }
};
export const get_top_category = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator <
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY TOP CUSTOMERS
         * ==========================================
         */

        const query = `
            SELECT 
                categ_id,
                TRIM(
                    split_part(
                        categ_name, 
                        '/', 
                        array_length(string_to_array(categ_name, '/'), 1)
                    )
                ) AS categ_name,
                total_amount,
                total_qty,
                ROUND(
                    total_amount * 100.0 / NULLIF(SUM(total_amount) OVER (), 0), 
                    2
                ) AS percentage
            FROM (
                SELECT 
                    (elem->'product_template'->'categ_id'->>0)::int AS categ_id,
                    elem->'product_template'->'categ_id'->>1 AS categ_name,
                    SUM(
                        (elem->>'price_subtotal')::numeric 
                        + (amount_tax / NULLIF(jsonb_array_length(order_line), 0))
                    ) AS total_amount,
                    SUM((elem->>'po_qty')::numeric) AS total_qty
                FROM sales_orders,
                LATERAL jsonb_array_elements(order_line) AS elem
                ${whereClause}
                AND elem->'product_template'->'categ_id' IS NOT NULL
                GROUP BY categ_id, categ_name
                HAVING SUM(
                    (elem->>'price_subtotal')::numeric 
                    + (amount_tax / NULLIF(jsonb_array_length(order_line), 0))
                ) >= 0
            ) sub
            ORDER BY total_amount DESC;
        `;

        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error("get_top_category error:", error);

        res.status(500).json({
            error: "Failed to get top category",
            message: error.message
        });
    }
};
export const get_sales_report_yoy = async (req, res) => {
    try {
        const { company_id } = req.query;
        const values = [];
        const conditions = [];

        if (company_id) {
            values.push(Number(company_id));
            conditions.push(`(company_id->>0)::integer = $${values.length}`);
        }

        const whereClause = conditions.length > 0
            ? `AND ${conditions.join(' AND ')}`
            : '';

        const query = `
            SELECT 
                to_char(date_order, 'YYYY-MM') AS bulan,
                to_char(date_order, 'TMMonth') AS nama_bulan,
                SUM(amount_total) AS total_amount
            FROM sales_orders
            WHERE date_order <= CURRENT_DATE
            AND date_order >= date_trunc('year', CURRENT_DATE - INTERVAL '1 year')
            AND EXTRACT(MONTH FROM date_order) <= EXTRACT(MONTH FROM CURRENT_DATE)
            ${whereClause}
            GROUP BY to_char(date_order, 'YYYY-MM'), to_char(date_order, 'TMMonth')
            ORDER BY bulan
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_sales_report_yoy error:", error);

        res.status(500).json({
            error: "Failed to get report yoy",
            message: error.message
        });
    }
}
export const get_sales_report_mom = async(req,res) => {
    try {
        const { company_id } = req.query;
        const values = [];
        const conditions = [
            `date_order <= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')`,
            `date_order > DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 month'`
        ];

        if (company_id) {
            const parsedId = Number(company_id);
            if (isNaN(parsedId)) {
                return res.status(400).json({ error: "company_id harus berupa angka" });
            }
            values.push(parsedId);
            conditions.push(`(company_id->>0)::integer = $${values.length}`);
        }

        const whereClause = conditions.join(' AND ');

        const query = `
            SELECT bulan, nama_bulan, total_amount, persen_perubahan
            FROM (
                SELECT bulan, nama_bulan, total_amount,
                    ROUND(
                        ((total_amount - LAG(total_amount) OVER (ORDER BY bulan)) 
                        / LAG(total_amount) OVER (ORDER BY bulan)) * 100, 2
                    ) AS persen_perubahan
                FROM (
                    SELECT to_char(date_order, 'YYYY-MM') AS bulan, 
                        to_char(date_order, 'TMMonth') AS nama_bulan, 
                        SUM(amount_total) AS total_amount
                    FROM sales_orders
                    WHERE ${whereClause}
                    GROUP BY to_char(date_order, 'YYYY-MM'), to_char(date_order, 'TMMonth')
                ) sub
            ) sub2
            WHERE bulan >= to_char(DATE_TRUNC('year', CURRENT_DATE), 'YYYY-MM')
            ORDER BY bulan;
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_sales_report_mom error:", error);

        res.status(500).json({
            error: "Failed to get report mom",
            message: error.message
        });
    }
}
export const get_sales_report_mtd = async(req,res) => {
    try {
        const { company_id } = req.query;
        const values = [];
        const conditions = [
            `(
                (date_order >= date_trunc('month', CURRENT_DATE) AND date_order <= CURRENT_DATE) 
                OR 
                (date_order >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                AND date_order <= (CURRENT_DATE - INTERVAL '1 month'))
            )`
        ];

        if (company_id) {
            const parsedId = Number(company_id);
            if (isNaN(parsedId)) {
                return res.status(400).json({ error: "company_id harus berupa angka" });
            }
            values.push(parsedId);
            conditions.push(`(company_id->>0)::integer = $${values.length}`);
        }

        const whereClause = conditions.join(' AND ');

        const query = `
            SELECT
                SUM(
                    CASE WHEN date_order >= date_trunc('month', CURRENT_DATE) 
                        AND date_order <= CURRENT_DATE 
                    THEN amount_total ELSE 0 END
                ) AS total_bulan_ini,
                SUM(
                    CASE WHEN date_order >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                        AND date_order <= (CURRENT_DATE - INTERVAL '1 month')
                    THEN amount_total ELSE 0 END
                ) AS total_bulan_lalu,
                ROUND(
                    (
                        SUM(
                            CASE WHEN date_order >= date_trunc('month', CURRENT_DATE) 
                                AND date_order <= CURRENT_DATE 
                            THEN amount_total ELSE 0 END
                        )
                        -
                        SUM(
                            CASE WHEN date_order >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                AND date_order <= (CURRENT_DATE - INTERVAL '1 month')
                            THEN amount_total ELSE 0 END
                        )
                    ) 
                    / NULLIF(
                        SUM(
                            CASE WHEN date_order >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                AND date_order <= (CURRENT_DATE - INTERVAL '1 month')
                            THEN amount_total ELSE 0 END
                        ), 0
                    ) * 100, 2
                ) AS persen_perubahan,

                -- Label bulan ini, contoh: "1-13 Agustus 2026"
                to_char(date_trunc('month', CURRENT_DATE), 'FMDD') || '-' ||
                to_char(CURRENT_DATE, 'FMDD') || ' ' ||
                (ARRAY['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'])[EXTRACT(MONTH FROM CURRENT_DATE)::int] || ' ' ||
                EXTRACT(YEAR FROM CURRENT_DATE)::int AS label_bulan_ini,

                -- Label bulan lalu, contoh: "1-13 Juli 2026"
                to_char(date_trunc('month', CURRENT_DATE - INTERVAL '1 month'), 'FMDD') || '-' ||
                to_char((CURRENT_DATE - INTERVAL '1 month')::date, 'FMDD') || ' ' ||
                (ARRAY['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'])[EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month'))::int] || ' ' ||
                EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'))::int AS label_bulan_lalu

            FROM sales_orders 
            WHERE ${whereClause};
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_sales_report_mtd error:", error);

        res.status(500).json({
            error: "Failed to get report mtd",
            message: error.message
        });
    }
}
export const get_sales_report_ytd = async (req, res) => {
    try {
        const { company_id } = req.query;
        const values = [];
        const conditions = [];

        if (company_id) {
            const parsedId = Number(company_id);
            if (isNaN(parsedId)) {
                return res.status(400).json({ error: "company_id harus berupa angka" });
            }
            values.push(parsedId);
            conditions.push(`(company_id->>0)::integer = $${values.length}`);
        }

        const extraWhere = conditions.length > 0
            ? `AND ${conditions.join(' AND ')}`
            : '';

        const query = `
            WITH periode_ini AS (
                SELECT SUM(amount_total) AS total
                FROM sales_orders
                WHERE date_order <= CURRENT_DATE
                  AND date_order >= DATE_TRUNC('year', CURRENT_DATE)
                  ${extraWhere}
            ),
            periode_lalu AS (
                SELECT SUM(amount_total) AS total
                FROM sales_orders
                WHERE date_order <= (CURRENT_DATE - INTERVAL '1 year')
                  AND date_order >= (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year')
                  ${extraWhere}
            )
            SELECT
                COALESCE(periode_ini.total, 0) AS total_tahun_ini,
                COALESCE(periode_lalu.total, 0) AS total_tahun_lalu,
                ROUND(
                    ((COALESCE(periode_ini.total, 0) - COALESCE(periode_lalu.total, 0))
                    / COALESCE(periode_lalu.total, 1)) * 100, 2
                ) AS persen_perubahan,
                to_char(DATE_TRUNC('year', CURRENT_DATE), 'FMDD Mon YYYY') || ' - ' || 'Today'  AS label_tahun_ini,
                to_char(DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year', 'FMDD Mon YYYY') || ' - ' || to_char(CURRENT_DATE - INTERVAL '1 year', 'FMDD Mon YYYY') AS label_tahun_lalu
            FROM periode_ini, periode_lalu;
        `;
        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_sales_report_ytd error:", error);

        res.status(500).json({
            error: "Failed to get report ytd",
            message: error.message
        });
    }
};
export const get_company_stats = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator 
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY COMPANY STATS
         * ==========================================
         */

        const query = `
            SELECT
                date_order::date AS date_order,

                (company_id->>0)::integer AS company_id,
                company_id->>1 AS company_name,

                SUM(amount_total) AS total_amount

            FROM sales_orders

            ${whereClause}

            GROUP BY
                date_order::date,
                (company_id->>0)::integer,
                company_id->>1

            ORDER BY date_order::date
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_company_stats error:", error);

        res.status(500).json({
            error: "Failed to get company stats",
            message: error.message
        });
    }
};
export const get_number_of_customers = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator <
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY TOP CUSTOMERS
         * ==========================================
         */

        const query = `
            SELECT
                (company_id->>0)::integer AS company_id,
                company_id->>1 AS company_name,

                (partner_id->>0)::integer AS partner_id,
                partner_id->>1 AS customer_name,

                SUM(amount_total) AS total_amount,

                ROUND(
                    SUM(amount_total) * 100.0
                    / NULLIF(
                        SUM(SUM(amount_total)) OVER (),
                        0
                    ),
                    2
                ) AS percentage

            FROM sales_orders

            ${whereClause}

            GROUP BY
                (company_id->>0)::integer,
                company_id->>1,
                (partner_id->>0)::integer,
                partner_id->>1

            ORDER BY total_amount DESC
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_top_customers error:", error);

        res.status(500).json({
            error: "Failed to get top customers",
            message: error.message
        });
    }
};
export const get_discount_given = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator 
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // end_date = 2026
                //
                // sampai sebelum 2027-01-01
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                //
                // sampai akhir hari tersebut
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY DISCOUNT GIVEN
         * ==========================================
         */

        const query = `
            SELECT
                SUM(amount_undiscounted - amount_untaxed) AS total_discount

            FROM sales_orders

            ${whereClause}
        `;

        const result = await pool.query(query, values);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("get_discount_given error:", error);

        res.status(500).json({
            error: "Failed to get discount given",
            message: error.message
        });
    }
};
export const get_top_products = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id,
            show_all
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */
        if (start_date) {
            if (filter_type === "month") {
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        if (company_id) {
            values.push(Number(company_id));
            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";
        const limitClause = show_all === "true" ? "" : "LIMIT 10";

        /*
         * ==========================================
         * QUERY TOP PRODUCTS
         * ==========================================
         */

        const query = `
            SELECT 
                company_id,
                company_name,
                product_name,
                total_amount,
                total_qty,
                ROUND(
                    total_amount * 100.0 / NULLIF(SUM(total_amount) OVER (), 0), 
                    2
                ) AS percentage
            FROM (
                SELECT 
                    (company_id->>0)::integer AS company_id, 
                    company_id->>1 AS company_name,
                    elem->'product_template'->>'name' AS product_name,
                    SUM(
                        (elem->>'price_subtotal')::numeric 
                        + (amount_tax / NULLIF(jsonb_array_length(order_line), 0))
                    ) AS total_amount,
                    SUM((elem->>'po_qty')::numeric) AS total_qty
                FROM sales_orders,
                LATERAL jsonb_array_elements(order_line) AS elem
                ${whereClause}
                GROUP BY (company_id->>0)::integer, company_id->>1, product_name
                HAVING SUM((elem->>'po_qty')::numeric) > 0
            ) sub
            ORDER BY total_amount DESC
            ${limitClause}
        `;
        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_top_products error:", error);

        res.status(500).json({
            error: "Failed to get top products",
            message: error.message
        });
    }
};
export const get_top_brands = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * ==========================================
         */

        if (start_date) {
            if (filter_type === "month") {
                values.push(`${start_date}-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );

            } else {
                values.push(start_date);

                conditions.push(
                    `date_order >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                values.push(`${end_date}-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                values.push(end_date);

                conditions.push(
                    `date_order < (
                        $${values.length}::date
                        + INTERVAL '1 day'
                    )`
                );
            }
        }

        /*
         * ==========================================
         * FILTER COMPANY
         * ==========================================
         */

        if (company_id) {
            values.push(Number(company_id));

            conditions.push(
                `(company_id->>0)::integer = $${values.length}`
            );
        }

        /*
         * ==========================================
         * WHERE CLAUSE
         * ==========================================
         */

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        /*
         * ==========================================
         * QUERY TOP BRANDS
         * ==========================================
         */

        const query = `
            SELECT
                (company_id->>0)::integer AS company_id,
                company_id->>1 AS company_name,

                CASE
                    WHEN jsonb_typeof(line->'product_template'->'x_studio_brand') = 'array'
                        THEN (line->'product_template'->'x_studio_brand'->>0)::integer
                    ELSE 0
                END AS brand_id,

                CASE
                    WHEN jsonb_typeof(line->'product_template'->'x_studio_brand') = 'array'
                        THEN TRIM(
                            regexp_replace(
                                line->'product_template'->'x_studio_brand'->>1,
                                '^.*/',
                                ''
                            )
                        )
                    ELSE 'No Brand'
                END AS brand_name,

                SUM(
                    (line->>'price_subtotal')::numeric
                    + amount_tax / NULLIF(jsonb_array_length(order_line), 0)
                ) AS total_amount,
				SUM((line->>'po_qty')::numeric) AS total_qty,

                ROUND(
                    SUM(
                        (line->>'price_subtotal')::numeric
                        + amount_tax / NULLIF(jsonb_array_length(order_line), 0)
                    ) * 100.0
                    / NULLIF(
                        SUM(
                            SUM(
                                (line->>'price_subtotal')::numeric
                                + amount_tax / NULLIF(jsonb_array_length(order_line), 0)
                            )
                        ) OVER (),
                        0
                    ),
                    2
                ) AS percentage

            FROM sales_orders
            CROSS JOIN LATERAL jsonb_array_elements(order_line) AS line

            ${whereClause} AND (line->>'po_qty')::numeric > 0

            GROUP BY
                (company_id->>0)::integer,
                company_id->>1,
                CASE
                    WHEN jsonb_typeof(line->'product_template'->'x_studio_brand') = 'array'
                        THEN (line->'product_template'->'x_studio_brand'->>0)::integer
                    ELSE 0
                END,
                CASE
                    WHEN jsonb_typeof(line->'product_template'->'x_studio_brand') = 'array'
                        THEN TRIM(
                            regexp_replace(
                                line->'product_template'->'x_studio_brand'->>1,
                                '^.*/',
                                ''
                            )
                        )
                    ELSE 'No Brand'
                END

            ORDER BY total_amount DESC

            LIMIT 10
        `;

        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error("get_top_brands error:", error);

        res.status(500).json({
            error: "Failed to get top brands",
            message: error.message
        });
    }
};
export const get_sales_person=async(req,res)=>{
    let query=`SELECT create_uid[1], SUM(amount_total) AS total_sales FROM sales_orders GROUP BY create_uid[1]`;
    const result=await pool.query(query);
    res.json(result.rows);
}

export const truncateInsertSalesOrder=async(req,res)=>{
    const client = await pool.connect();

    const limit = 500;
    let offset = 0;
    let totalInserted = 0;

    try {
        await client.query("BEGIN");

        // Hapus data lama
        await client.query(`
            TRUNCATE TABLE sales_orders RESTART IDENTITY
        `);

        while (true) {

            console.log(
                `Fetching sales orders: offset=${offset}, limit=${limit}`
            );

            const response = await fetch(
                `${BASE_URL}/sales/get/so_analytic?limit=${limit}&offset=${offset}`
            );

            if (!response.ok) {
                const errorText = await response.text();

                console.error("Odoo API Status:", response.status);
                console.error("Odoo API Response:", errorText);

                throw new Error(
                    `External API error: ${response.status} - ${errorText}`
                );
            }

            const api = await response.json();
            const rows = api?.data ?? [];

            if (!Array.isArray(rows)) {
                throw new Error("Format data dari API tidak valid");
            }

            // Tidak ada data lagi
            if (rows.length === 0) {
                break;
            }

            for (const r of rows) {

                const toJson = (value) => {
                    if (value === null || value === undefined) {
                        return null;
                    }

                    if (typeof value === "string") {
                        try {
                            return JSON.stringify(JSON.parse(value));
                        } catch {
                            return JSON.stringify(value);
                        }
                    }

                    return JSON.stringify(value);
                };

                await client.query(
                    `
                    INSERT INTO sales_orders (
                        id,
                        access_url,
                        amount_invoiced,
                        amount_paid,
                        amount_tax,
                        amount_to_invoice,
                        amount_total,
                        amount_undiscounted,
                        amount_unpaid,
                        amount_untaxed,
                        company_id,
                        company_price_include,
                        country_code,
                        create_date,
                        create_uid,
                        currency_id,
                        customizable_pdf_form_fields,
                        date_order,
                        delivery_count,
                        delivery_status,
                        display_name,
                        duplicated_order_ids,
                        effective_date,
                        expected_date,
                        medium_id,
                        name,
                        order_line,
                        partner_id,
                        partner_invoice_id,
                        partner_shipping_id,
                        picking_ids,
                        planning_initial_date,
                        pricelist_id,
                        tax_calculation_rounding_method,
                        tax_country_id,
                        team_id,
                        type_name,
                        user_id,
                        validity_date,
                        warehouse_id,
                        invoice_status,
                        write_date,
                        delivery_date,
                        write_uid
                    )
                    VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                        $11::jsonb,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,$19,$20,
                        $21,$22,$23,$24,$25,$26,$27::jsonb,
                        $28::jsonb,$29::jsonb,$30::jsonb,$31,$32,$33::jsonb,$34,$35::jsonb,$36::jsonb,
                        $37,$38::jsonb,$39,$40::jsonb,$41,$42,$43,$44::jsonb
                    )
                    `,
                    [
                        r.id,
                        r.access_url,
                        r.amount_invoiced,
                        r.amount_paid,
                        r.amount_tax,
                        r.amount_to_invoice,
                        r.amount_total,
                        r.amount_undiscounted,
                        r.amount_unpaid,
                        r.amount_untaxed,
                        toJson(r.company_id),
                        r.company_price_include,
                        r.country_code,
                        r.create_date ? new Date(r.create_date) : null,
                        toJson(r.create_uid),
                        toJson(r.currency_id),
                        r.customizable_pdf_form_fields,
                        r.date_order ? new Date(r.date_order) : null,
                        r.delivery_count,
                        r.delivery_status,
                        r.display_name,
                        toJson(r.duplicated_order_ids),
                        r.effective_date
                            ? new Date(r.effective_date)
                            : null,
                        r.expected_date
                            ? new Date(r.expected_date)
                            : null,
                        // r.expense_count,
                        // r.margin,
                        // r.margin_percent,
                        toJson(r.medium_id),
                        r.name,
                        toJson(r.lines),
                        toJson(r.partner_id),
                        toJson(r.partner_invoice_id),
                        toJson(r.partner_shipping_id),
                        toJson(r.picking_ids),
                        r.planning_initial_date,
                        toJson(r.pricelist_id),
                        r.tax_calculation_rounding_method,
                        toJson(r.tax_country_id),
                        toJson(r.team_id),
                        r.type_name,
                        toJson(r.user_id),
                        r.validity_date ? new Date(r.validity_date) : null,
                        toJson(r.warehouse_id),
                        r.invoice_status,
                        r.commitment_date
                            ? new Date(r.commitment_date)
                            : null,
                        r.write_date
                            ? new Date(r.write_date)
                            : null,
                        toJson(r.write_uid)
                    ]
                );
            }

            totalInserted += rows.length;

            console.log(
                `Inserted: ${rows.length}, total: ${totalInserted}`
            );

            // Jika jumlah data kurang dari limit,
            // berarti sudah mencapai halaman terakhir
            if (rows.length < limit) {
                break;
            }

            offset += limit;
        }

        await client.query("COMMIT");

        return {
            status: "success",
            message: "SYNC SUCCESS — truncate & insert sales orders table",
            inserted: totalInserted,
        };

    } catch (err) {

        await client.query("ROLLBACK");

        console.error("SYNC ERROR:", err);

        throw err;

    } finally {
        client.release();
    }
}