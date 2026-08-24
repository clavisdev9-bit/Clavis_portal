import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;

export const get_invoices = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        let query = `SELECT * FROM invoices`;
        const values = [];
        const conditions = [];

        if (date_from) {
            values.push(date_from);
            conditions.push(`invoice_date >= $${values.length}`);
        }

        if (date_to) {
            values.push(date_to);
            conditions.push(`invoice_date <= $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY invoice_date DESC`;

        const result = await pool.query(query, values);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
export const get_total_invoice=async(req,res)=>{
    let query='SELECT COUNT(*) AS total_invoices FROM invoices';
    const result = await pool.query(query);
    res.json(result);
}
export const get_total_billed=async(req,res)=>{
    let query=`SELECT 
    SUM(amount_total) AS total_billed,
    SUM(amount_total - amount_residual) AS total_paid,
    SUM(amount_residual) AS outstanding_balance
    FROM invoices`;
    const result = await pool.query(query);
    res.json(result);
}
export const get_average_days_to_payment=async(req,res)=>{
    let query=`SELECT AVG(next_payment_date - invoice_date) AS avg_days_to_payment
    FROM invoices
    WHERE state = 'Paid' AND next_payment_date IS NOT NULL;`;
    const result = await pool.query(query);
    res.json(result);
}
export const get_percent_paid_on_time=async(req,res)=>{
    let query=`SELECT
    ROUND(SUM(CASE WHEN next_payment_date <= invoice_date_due THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS pct_paid_on_time
    FROM invoices
    WHERE state = 'Paid' AND next_payment_date IS NOT NULL`;
    const result = await pool.query(query);
    res.json(result);
}
export const get_billing_trend=async(req,res)=>{
    let query=`SELECT
                DATE_TRUNC('month', invoice_date) AS month,
                TO_CHAR(DATE_TRUNC('month', invoice_date), 'Mon') AS month_name,
                SUM(amount_total) AS billed_amount
                FROM invoices
                where DATE_TRUNC('month', invoice_date) is not null
                GROUP BY month
                ORDER BY month`;
    const result=await pool.query(query);
    res.json(result);
}
export const get_collection_trend=async(req,res)=>{
    let query=`SELECT
    DATE_TRUNC('month', invoice_date) AS month,
    TO_CHAR(DATE_TRUNC('month', invoice_date), 'Mon') AS month_name,
    SUM(amount_total - amount_residual) AS amount_paid,
    SUM(amount_residual) AS outstanding_amount
    FROM invoices where DATE_TRUNC('month', invoice_date) is not null
    GROUP BY month
    ORDER BY month`;
    const result=await pool.query(query);
    res.json(result);
}
export const get_aging_analysis=async(req,res)=>{
    let query=`SELECT
        CASE
        WHEN CURRENT_DATE - invoice_date_due <= 30 THEN '0-30 Days'
        WHEN CURRENT_DATE - invoice_date_due BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN CURRENT_DATE - invoice_date_due BETWEEN 61 AND 90 THEN '61-90 Days'
        ELSE '>90 Days'
        END AS aging_bucket,
        SUM(amount_residual) AS outstanding_balance
        FROM invoices
        WHERE payment_state = 'not_paid'
        GROUP BY aging_bucket
        ORDER BY aging_bucket`;
    const result=await pool.query(query);
    res.json(result);
}
export const top_customer=async(req,res)=>{
    let query=`SELECT
    partner_id,
    SUM(amount_total) AS total_billed
    FROM invoices
    GROUP BY partner_id
    ORDER BY total_billed DESC
    LIMIT 5`;
    const result=await pool.query(query);
    res.json(result);
}
export const top_customer_outstanding=async(req,res)=>{
    let query=`SELECT
    partner_id,
    SUM(amount_residual) AS outstanding_balance
    FROM invoices
    GROUP BY partner_id
    ORDER BY outstanding_balance DESC
    LIMIT 5`;
    const result=await pool.query(query);
    res.json(result);
}
export const get_sales_stats = async (req, res) => {
    const { start_date, end_date, filter_type } = req.query;

    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }

    let query = `
        SELECT
            TO_CHAR(invoice_date,'${format}') AS write_date,
            company_id[1] company,
            partner_id[1] AS customer_name,
            SUM(amount_total) AS total_amount
        FROM invoices
    `;

    const values = [];

    if (start_date && end_date) {
        query += `
            WHERE TO_CHAR(invoice_date,'${format}') BETWEEN $1 AND $2
        `;
        values.push(start_date, end_date);
    } else {
        // Default: 7 hari terakhir
        query += `
            WHERE DATE(invoice_date) IN (
                SELECT DISTINCT DATE(invoice_date)
                FROM invoices
                ORDER BY DATE(invoice_date) DESC
                LIMIT 7
            )
        `;
    }

    query += `
        GROUP BY
            TO_CHAR(invoice_date,'${format}'),
            company_id[1],
            partner_id[1]
        ORDER BY
            TO_CHAR(invoice_date,'${format}');
    `;
    const result = await pool.query(query, values);

    res.json(result.rows);
};
export const get_company_revenue = async (req, res) => {
    const { start_date, end_date, filter_type } = req.query;

    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }

    let query = `
        SELECT
            company_id[1] company,
            SUM(amount_total) AS total_amount
        FROM invoices
    `;

    const values = [];

    if (start_date && end_date) {
        query += `
            WHERE TO_CHAR(invoice_date,'${format}') BETWEEN $1 AND $2
        `;
        values.push(start_date, end_date);
    } else {
        // Default: 7 hari terakhir
        query += `
            WHERE DATE(invoice_date) IN (
                SELECT DISTINCT DATE(invoice_date)
                FROM invoices
                ORDER BY DATE(invoice_date) DESC
                LIMIT 7
            )
        `;
    }

    query += `GROUP BY company_id[1];`;
    const result = await pool.query(query, values);

    res.json(result.rows);
};
export const get_company_residual=async(req,res)=>{
    const { start_date, end_date, filter_type, company_id } = req.query;

    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }

    let query = `
        SELECT
            SUM(amount_residual) AS residual_amount
        FROM invoices
    `;

    const values = [];
    const conditions = [];

    // Filter tanggal
    if (start_date && end_date) {
        values.push(start_date, end_date);

        conditions.push(
            `TO_CHAR(invoice_date,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
        );
    } else {
        conditions.push(`
            DATE(invoice_date) IN (
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
            AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
        `;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
}
export const get_company_paid=async(req,res)=>{
    const { start_date, end_date, filter_type, company_id } = req.query;

    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }

    let query = `
        SELECT
            SUM(amount_total-amount_residual) AS amount_paid
        FROM invoices
    `;

    const values = [];
    const conditions = [];

    // Filter tanggal
    if (start_date && end_date) {
        values.push(start_date, end_date);

        conditions.push(
            `TO_CHAR(invoice_date,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
        );
    } else {
        conditions.push(`
            DATE(invoice_date) IN (
                SELECT DISTINCT DATE(invoice_date)
                FROM invoices
                ORDER BY DATE(invoice_date) DESC
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
            AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
        `;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
}
export const get_company_invoices = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id,
            partner_id
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
                    `invoice_date >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
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
                    `invoice_date < (
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
                    `invoice_date < (
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
                    `invoice_date < (
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
            select invoice_date,partner_id->>1 customer_name,amount_total,amount_tax,(amount_total-amount_residual) amount_paid,amount_residual,payment_state,invoice_date_due,invoice_origin
            from invoices ${whereClause} AND invoice_origin IS NOT NULL AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0 AND amount_total>0
        `;
        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_company_invoices error:", error);

        res.status(500).json({
            error: "Failed to get company invoices",
            message: error.message
        });
    }
};
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
        FROM invoices
    `;

    const values = [];
    const conditions = [];

    // Filter tanggal
    if (start_date && end_date) {
        values.push(start_date, end_date);

        conditions.push(
            `TO_CHAR(invoice_date,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
        );
    } else {
        conditions.push(`
            DATE(invoice_date) IN (
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
            AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
        `;
    }

    const result = await pool.query(query, values);

    res.json(result.rows);
}
export const first_last_date = async(req,res)=>{
    let query = `SELECT TO_CHAR(MIN(date_invoice), 'YYYY-MM-DD') AS first_date, TO_CHAR(MAX(date_invoice), 'YYYY-MM-DD') AS last_date 
    FROM (SELECT DISTINCT DATE(invoice_date) AS date_invoice 
    FROM invoices ORDER BY date_invoice DESC LIMIT 7) t;`;
    const result = await pool.query(query);
    res.json(result.rows);
}
export const get_invoice_report_mtd = async(req,res) => {
    try {
        const { company_id } = req.query;
        const values = [];
        const conditions = [
            `(
                (invoice_date >= date_trunc('month', CURRENT_DATE) AND invoice_date <= CURRENT_DATE) 
                OR 
                (invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                AND invoice_date <= (CURRENT_DATE - INTERVAL '1 month'))
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
                    CASE WHEN invoice_date >= date_trunc('month', CURRENT_DATE) 
                        AND invoice_date <= CURRENT_DATE 
                    THEN amount_total ELSE 0 END
                ) AS total_bulan_ini,
                SUM(
                    CASE WHEN invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                        AND invoice_date <= (CURRENT_DATE - INTERVAL '1 month')
                    THEN amount_total ELSE 0 END
                ) AS total_bulan_lalu,
                ROUND(
                    (
                        SUM(
                            CASE WHEN invoice_date >= date_trunc('month', CURRENT_DATE) 
                                AND invoice_date <= CURRENT_DATE 
                            THEN amount_total ELSE 0 END
                        )
                        -
                        SUM(
                            CASE WHEN invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                AND invoice_date <= (CURRENT_DATE - INTERVAL '1 month')
                            THEN amount_total ELSE 0 END
                        )
                    ) 
                    / NULLIF(
                        SUM(
                            CASE WHEN invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                AND invoice_date <= (CURRENT_DATE - INTERVAL '1 month')
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

            FROM invoices 
            WHERE ${whereClause};
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_invoice_report_mtd error:", error);

        res.status(500).json({
            error: "Failed to get report mtd",
            message: error.message
        });
    }
}
export const get_invoice_report_ytd = async (req, res) => {
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
                FROM invoices
                WHERE invoice_date <= CURRENT_DATE
                AND invoice_date >= DATE_TRUNC('year', CURRENT_DATE)
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                ${extraWhere}
            ),
            periode_lalu AS (
                SELECT SUM(amount_total) AS total
                FROM invoices
                WHERE invoice_date <= (CURRENT_DATE - INTERVAL '1 year')
                AND invoice_date >= (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year')
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                ${extraWhere}
            )
            SELECT
                COALESCE(periode_ini.total, 0) AS total_tahun_ini,
                COALESCE(periode_lalu.total, 0) AS total_tahun_lalu,
                ROUND(
                    ((COALESCE(periode_ini.total, 0) - COALESCE(periode_lalu.total, 0))
                    / COALESCE(periode_lalu.total, 1)) * 100, 2
                ) AS persen_perubahan,
                to_char(DATE_TRUNC('year', CURRENT_DATE), 'FMDD Mon YYYY') || ' - ' || 'Today' AS label_tahun_ini,
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
export const get_invoice_stats_ytd = async (req, res) => {
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
                    DATE_TRUNC('month', invoice_date) AS bulan_urut,
                    SUM(amount_total)                 AS total_bulan
                FROM invoices
                WHERE (
                        (invoice_date <= CURRENT_DATE 
                        AND invoice_date >= DATE_TRUNC('year', CURRENT_DATE))
                        OR
                        (invoice_date <= CURRENT_DATE - INTERVAL '1 year' 
                        AND invoice_date >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year')
                    )
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                ${extraWhere}
                GROUP BY DATE_TRUNC('month', invoice_date)
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
export const get_total_invoice_by_company=async(req,res)=>{
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
        FROM invoices
    `;

    const values = [];
    const conditions = [];

    // Filter tanggal
    if (start_date && end_date) {
        values.push(start_date, end_date);

        conditions.push(
            `TO_CHAR(invoice_date,'${format}') BETWEEN $${values.length - 1} AND $${values.length} `
        );
    } else {
        conditions.push(`
            DATE(invoice_date) IN (
                SELECT DISTINCT DATE(invoice_date)
                FROM invoices
                ORDER BY DATE(invoice_date) DESC
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
            WHERE ${conditions.join(" AND ")} AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
        `;
    }

    const result = await pool.query(query, values);

    res.json(result.rows);
}
export const get_payment_collection_trend = async (req, res) => {
    try {
        const { start_date, end_date, filter_type, company_id } = req.query;
        let format = "YYYY-MM-DD";

        if (filter_type === "month") {
            format = "YYYY-MM";
        } else if (filter_type === "year") {
            format = "YYYY";
        }

        let query = `
            SELECT
                TO_CHAR(invoice_date,'${format}') AS write_date,
                SUM(amount_total - amount_residual) AS amount_paid,
                SUM(amount_residual) AS outstanding_amount
            FROM invoices
        `;
        const values = [];
        const conditions = [];

        if (start_date && end_date) {
            values.push(start_date, end_date);

            conditions.push(
                `TO_CHAR(invoice_date,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
            );
        } else {
            // Default: 7 hari terakhir
            conditions.push(`
                DATE(invoice_date) IN (
                    SELECT DISTINCT DATE(invoice_date)
                    FROM sales_orders
                    ORDER BY DATE(invoice_date) DESC
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
                WHERE ${conditions.join(" AND ")} AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
            `;
        }
        query += `
            GROUP BY
                TO_CHAR(invoice_date,'${format}')
            ORDER BY
                TO_CHAR(invoice_date,'${format}')
        `;
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error("get_payment_collection_trend error:", error);

        res.status(500).json({
            error: "Failed to get payment collection trend",
            message: error.message
        });
    }
};
export const get_invoice_stats = async (req, res) => {
    const { start_date, end_date, filter_type, company_id, filter_by } = req.query;
    let selectField = `
        partner_id[1] AS label,
        SUM(amount_total) AS total_amount
    `;

    let groupField = `
        ,partner_id[1]
    `;

    let fromTable = `
        invoices
    `;

    let extraJoin = "";
    if (filter_by === "company") {
        selectField = `
            TO_CHAR(invoice_date,'YYYY-MM-DD') AS label,
            SUM(amount_total) AS total_amount
        `;
        groupField = `,invoice_date `;
    }
    if (filter_by === "product") {

        selectField = `
            line->'product_template'->>'name' AS label,
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(line_count.total_lines, 0)
            ) AS total_amount
        `;

        groupField = `
            ,line->'product_template'->>'name'
        `;

        extraJoin = `
            CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
            CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
            CROSS JOIN LATERAL (
                SELECT COUNT(*) AS total_lines
                FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
            ) AS line_count
        `;
    }
    if (filter_by === "brand") {

        selectField = `
            COALESCE(line->'product_template'->'x_studio_brand'->>1, 'No Brand') AS label,
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(line_count.total_lines, 0)
            ) AS total_amount
        `;

        groupField = `
            ,COALESCE(line->'product_template'->'x_studio_brand'->>1, 'No Brand')
        `;

        extraJoin = `
            CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
            CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
            CROSS JOIN LATERAL (
                SELECT COUNT(*) AS total_lines
                FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
            ) AS line_count
        `;
    }
    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }

    let query = `
        SELECT
            TO_CHAR(invoice_date,'${format}') AS write_date,
            company_id[1] company,
            company_id[0] company_id,
            ${selectField}
        FROM ${fromTable}
        ${extraJoin}
    `;

    const values = [];
    const conditions = [];

    if (start_date && end_date) {
        values.push(start_date, end_date);

        conditions.push(
            `TO_CHAR(invoice_date,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
        );
    } else {
        // Default: 7 hari terakhir
        conditions.push(`
            DATE(invoice_date) IN (
                SELECT DISTINCT DATE(invoice_date)
                FROM invoices
                ORDER BY DATE(invoice_date) DESC
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
            WHERE ${conditions.join(" AND ")} AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
        `;
    }

    query += `
        GROUP BY
            TO_CHAR(invoice_date,'${format}'),
            company_id[1],
            company_id[0]
            ${groupField}
        ORDER BY
            TO_CHAR(invoice_date,'${format}');
    `;
    const result = await pool.query(query, values);
    res.json(result.rows);
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
                    `invoice_date >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
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
                    `invoice_date < (
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
                    `invoice_date < (
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
                    `invoice_date < (
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
                    (line->'product_template'->'categ_id'->>0)::int AS categ_id,
                    line->'product_template'->'categ_id'->>1 AS categ_name,
                    SUM(
                        (line->>'price_subtotal')::numeric
                        + (amount_tax / NULLIF(line_count.total_lines, 0))
                    ) AS total_amount,
                    SUM((line->>'po_qty')::numeric) AS total_qty
                FROM invoices
                CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
                CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
                CROSS JOIN LATERAL (
                    SELECT COUNT(*) AS total_lines
                    FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                    CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
                ) AS line_count
                ${whereClause}
                AND line->'product_template'->'categ_id' IS NOT NULL
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                GROUP BY categ_id, categ_name
                HAVING SUM(
                    (line->>'price_subtotal')::numeric
                    + (amount_tax / NULLIF(line_count.total_lines, 0))
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
                    `invoice_date >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );

            } else {
                values.push(start_date);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                values.push(`${end_date}-01`);

                conditions.push(
                    `invoice_date < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `invoice_date < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                values.push(end_date);

                conditions.push(
                    `invoice_date < (
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
                    line->'product_template'->>'name' AS product_name,
                    SUM(
                        (line->>'price_subtotal')::numeric 
                        + (amount_tax / NULLIF(line_count.total_lines, 0))
                    ) AS total_amount,
                    SUM((line->>'po_qty')::numeric) AS total_qty
                FROM invoices
                CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
                CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
                CROSS JOIN LATERAL (
                    SELECT COUNT(*) AS total_lines
                    FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                    CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
                ) AS line_count
                ${whereClause}
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                GROUP BY (company_id->>0)::integer, company_id->>1, product_name
                HAVING SUM((line->>'po_qty')::numeric) > 0
            ) sub
            ORDER BY total_amount DESC ${limitClause};
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
export const get_top_customers = async (req, res) => {
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
                // Contoh:
                // start_date = 2026-07
                // menjadi 2026-07-01
                values.push(`${start_date}-01`);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                // Contoh:
                // start_date = 2026
                // menjadi 2026-01-01
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );

            } else {
                // day
                // Contoh:
                // 2026-07-22
                values.push(start_date);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
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
                    `invoice_date < (
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
                    `invoice_date < (
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
                    `invoice_date < (
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
        const limitClause = show_all === "true" ? "" : "LIMIT 10";
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

            FROM invoices

            ${whereClause} AND invoice_origin IS NOT NULL
			      AND jsonb_typeof(invoice_origin) = 'array'
			      AND jsonb_array_length(invoice_origin) > 0

            GROUP BY
                (company_id->>0)::integer,
                company_id->>1,
                (partner_id->>0)::integer,
                partner_id->>1

            ORDER BY total_amount DESC

            ${limitClause}
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
export const get_aging_analys = async (req, res) => {
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
            SELECT
            CASE
            WHEN CURRENT_DATE - invoice_date_due <= 30 THEN '0-30 Days'
            WHEN CURRENT_DATE - invoice_date_due BETWEEN 31 AND 60 THEN '31-60 Days'
            WHEN CURRENT_DATE - invoice_date_due BETWEEN 61 AND 90 THEN '61-90 Days'
            ELSE '>90 Days'
            END AS aging_bucket,
            SUM(amount_residual) AS outstanding_balance
            FROM invoices
            WHERE payment_state = 'not_paid' AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0 ${extraWhere}
            GROUP BY aging_bucket
            ORDER BY aging_bucket;
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
export const get_top_brands = async (req, res) => {
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
                    `invoice_date >= $${values.length}::date`
                );

            } else if (filter_type === "year") {
                values.push(`${start_date}-01-01`);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );

            } else {
                values.push(start_date);

                conditions.push(
                    `invoice_date >= $${values.length}::date`
                );
            }
        }

        if (end_date) {
            if (filter_type === "month") {
                values.push(`${end_date}-01`);

                conditions.push(
                    `invoice_date < (
                        $${values.length}::date
                        + INTERVAL '1 month'
                    )`
                );

            } else if (filter_type === "year") {
                values.push(`${end_date}-01-01`);

                conditions.push(
                    `invoice_date < (
                        $${values.length}::date
                        + INTERVAL '1 year'
                    )`
                );

            } else {
                values.push(end_date);

                conditions.push(
                    `invoice_date < (
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
        const limitClause = show_all === "true" ? "" : "LIMIT 10";
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
                    + amount_tax / NULLIF(line_count.total_lines, 0)
                ) AS total_amount,
                SUM((line->>'po_qty')::numeric) AS total_qty,

                ROUND(
                    SUM(
                        (line->>'price_subtotal')::numeric
                        + amount_tax / NULLIF(line_count.total_lines, 0)
                    ) * 100.0
                    / NULLIF(
                        SUM(
                            SUM(
                                (line->>'price_subtotal')::numeric
                                + amount_tax / NULLIF(line_count.total_lines, 0)
                            )
                        ) OVER (),
                        0
                    ),
                    2
                ) AS percentage

            FROM invoices
            CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
            CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
            CROSS JOIN LATERAL (
                SELECT COUNT(*) AS total_lines
                FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
            ) AS line_count

            ${whereClause} AND (line->>'po_qty')::numeric > 0
            AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0

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

            ${limitClause}
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

            FROM invoices

            WHERE invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0

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
export const truncateInsertInvoice=async()=>{
    const client = await pool.connect();

    const limit = 500;
    let offset = 0;
    let totalInserted = 0;

    try {
        await client.query("BEGIN");

        // Hapus data lama
        await client.query(`
            TRUNCATE TABLE invoices RESTART IDENTITY
        `);

        while (true) {

            console.log(
                `Fetching invoices: offset=${offset}, limit=${limit}`
            );

            const response = await fetch(
                `${BASE_URL}/api/account/invoice_analytics?limit=${limit}&offset=${offset}`
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
                    `INSERT INTO invoices (
                    id,
                    name,
                    move_type,
                    state,
                    partner_id,
                    commercial_partner_id,
                    company_id,
                    currency_id,
                    amount_total,
                    amount_untaxed,
                    amount_tax,
                    amount_residual,
                    amount_paid,
                    payment_state,
                    payment_reference,
                    invoice_date,
                    invoice_date_due,
                    next_payment_date,
                    journal_id,
                    invoice_origin,
                    invoice_line_ids,
                    line_ids,
                    payment_ids,
                    matched_payment_ids,
                    partner_bank_id,
                    bank_partner_id,
                    team_id,
                    user_id,
                    create_date,
                    write_date,
                    create_uid,
                    write_uid,
                    country_code,
                    tax_country_id,
                    l10n_id_kode_transaksi,
                    message_ids,
                    message_follower_ids,
                    audit_trail_message_ids
                    )
                    VALUES (
                        $1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,
                        $11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20::jsonb,
                        $21,$22,$23,$24,$25::jsonb,$26::jsonb,$27::jsonb,$28::jsonb,$29,$30,
                        $31::jsonb,$32::jsonb,$33,$34::jsonb,$35,$36,$37,$38
                    )`,
                    [
                        r.id,
                        r.name,
                        r.move_type,
                        r.state,
                        toJsonArray(r.partner_id),
                        toJsonArray(r.commercial_partner_id),
                        toJsonArray(r.company_id),
                        toJsonArray(r.currency_id),
                        r.amount_total,
                        r.amount_untaxed,

                        r.amount_tax,
                        r.amount_residual,
                        r.amount_paid,
                        r.payment_state,
                        r.payment_reference,
                        r.invoice_date ? new Date(r.invoice_date) : null,
                        r.invoice_date_due ? new Date(r.invoice_date_due) : null,
                        r.next_payment_date ? new Date(r.next_payment_date) : null,
                        toJsonArray(r.journal_id),
                        toJsonArray(r.invoice_origin),
                        [r.invoice_line_ids],
                        [r.line_ids],
                        [r.payment_ids],
                        [r.matched_payment_ids],
                        toJsonArray(r.partner_bank_id),
                        toJsonArray(r.bank_partner_id),
                        toJsonArray(r.team_id),
                        toJsonArray(r.user_id),
                        r.create_date,
                        r.write_date,
                        toJsonArray(r.create_uid),
                        toJsonArray(r.write_uid),
                        r.country_code,
                        toJsonArray(r.tax_country_id),
                        r.l10n_id_kode_transaksi,
                        [r.message_ids],
                        [r.message_follower_ids],
                        [r.audit_trail_message_ids]
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
            message: "SYNC SUCCESS — truncate & insert invoice table",
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
export const truncateInsertInvoices=async(req,res)=>{
    const response = await fetch(
        `${BASE_URL}/api/account/invoice`
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
        await client.query(`TRUNCATE TABLE invoices RESTART IDENTITY`);
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
                `INSERT INTO invoices (
                id,
                name,
                move_type,
                state,
                partner_id,
                commercial_partner_id,
                company_id,
                currency_id,
                amount_total,
                amount_untaxed,
                amount_tax,
                amount_residual,
                amount_paid,
                payment_state,
                payment_reference,
                invoice_date,
                invoice_date_due,
                next_payment_date,
                journal_id,
                invoice_origin,
                invoice_line_ids,
                line_ids,
                payment_ids,
                matched_payment_ids,
                partner_bank_id,
                bank_partner_id,
                team_id,
                user_id,
                create_date,
                write_date,
                create_uid,
                write_uid,
                country_code,
                tax_country_id,
                l10n_id_kode_transaksi,
                message_ids,
                message_follower_ids,
                audit_trail_message_ids
                )
                VALUES (
                    $1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,
                    $11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20,
                    $21,$22,$23,$24,$25::jsonb,$26::jsonb,$27::jsonb,$28::jsonb,$29,$30,
                    $31::jsonb,$32::jsonb,$33,$34::jsonb,$35,$36,$37,$38
                )`,
                [
                    r.id,
                    r.name,
                    r.move_type,
                    r.state,
                    toJsonArray(r.partner_id),
                    toJsonArray(r.commercial_partner_id),
                    toJsonArray(r.company_id),
                    toJsonArray(r.currency_id),
                    r.amount_total,
                    r.amount_untaxed,

                    r.amount_tax,
                    r.amount_residual,
                    r.amount_paid,
                    r.payment_state,
                    r.payment_reference,
                    r.invoice_date ? new Date(r.invoice_date) : null,
                    r.invoice_date_due ? new Date(r.invoice_date_due) : null,
                    r.next_payment_date ? new Date(r.next_payment_date) : null,
                    toJsonArray(r.journal_id),
                    r.invoice_origin,

                    [r.invoice_line_ids],
                    [r.line_ids],
                    [r.payment_ids],
                    [r.matched_payment_ids],
                    toJsonArray(r.partner_bank_id),
                    toJsonArray(r.bank_partner_id),
                    toJsonArray(r.team_id),
                    toJsonArray(r.user_id),
                    r.create_date,
                    r.write_date,
                    toJsonArray(r.create_uid),
                    toJsonArray(r.write_uid),
                    r.country_code,
                    toJsonArray(r.tax_country_id),
                    r.l10n_id_kode_transaksi,
                    [r.message_ids],
                    [r.message_follower_ids],
                    [r.audit_trail_message_ids]
                ]
            );
        }
        await client.query("COMMIT");

        console.log({
            message: "SYNC SUCCESS — truncate & insert invoices table",
            inserted: rows.length,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("DB Error:", err);
    } finally {
        client.release();
    }
}