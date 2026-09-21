import pool from "../db.js";
const BASE_URL=process.env.CLAVIS_BASE_URL;
const brandKeywordMap = {
    'PANASONIC': ['PANASONIC'],
    'HOT WHEELS': ['HOT WHEELS', 'HOTWHEELS'],
    'BARBIE': ['BARBIE'],
    'AMERICAN APPAREL': ['AMERICAN APPAREL'],
    'PAWS NOVA': ['SAMSAM', 'SAMSAMX'],
    'GILDAN': ['GILDAN'],
};
const fallbackBrandNames = Object.keys(brandKeywordMap);
function buildBrandLabelCaseSql() {
    const nameExpr = `COALESCE(line->'product_template'->>'name', line->>'name')`;

    const fallbackWhens = Object.entries(brandKeywordMap)
        .map(([brandName, keywords]) => {
            const conditions = keywords
                .map((keyword) => `${nameExpr} ILIKE '%${keyword.replace(/'/g, "''")}%'`)
                .join(' OR ');
            return `WHEN ${conditions} THEN '${brandName.replace(/'/g, "''")}'`;
        })
        .join('\n            ');

    return `
        CASE
            WHEN jsonb_typeof(line->'product_template'->'x_studio_brand') = 'array'
                THEN COALESCE(
                    NULLIF(
                        TRIM(
                            (regexp_split_to_array(
                                line->'product_template'->'x_studio_brand'->>1,
                                '/'
                            ))[
                                array_upper(
                                    regexp_split_to_array(
                                        line->'product_template'->'x_studio_brand'->>1,
                                        '/'
                                    ),
                                    1
                                )
                            ]
                        ),
                        ''
                    ),
                    'No Brand'
                )
            ${fallbackWhens}
            ELSE 'No Brand'
        END
    `;
}
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
            SUM(amount_total) AS total_amount,
            ROUND(
                SUM(amount_total) * 100.0 / NULLIF(SUM(SUM(amount_total)) OVER (), 0),
                2
            ) AS percentage
        FROM invoices
    `;

    const values = [];

    if (start_date && end_date) {
        query += `
            WHERE TO_CHAR(invoice_date,'${format}') BETWEEN $1 AND $2 AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
            AND state = 'posted'
            AND move_type='out_invoice'
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
            AND state = 'posted'
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
            AND state='posted'
            AND move_type='out_invoice'
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
            AND state='posted'
            AND move_type='out_invoice'
        `;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
}
export const get_company_list = async (req, res) => {
    try {
        const { date,filter_type } = req.query;
        const values = [date];
        let format = "YYYY-MM-DD";

        if (filter_type === "month") {
            format = "YYYY-MM";
        } else if (filter_type === "year") {
            format = "YYYY";
        }
        const query = `
            SELECT 
                TO_CHAR(invoice_date,'${format}') AS write_date,
                company_id[1] AS company_name,
                SUM(amount_total) AS total_amount
            FROM 
                invoices
            WHERE 
                TO_CHAR(invoice_date,'${format}') = $1 AND invoice_origin IS NOT NULL AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0 AND amount_total>0
            GROUP BY
                TO_CHAR(invoice_date,'${format}'),
                company_id[1]
            HAVING SUM(amount_total) <> 0
            ORDER BY
                TO_CHAR(invoice_date,'${format}');
        `;
        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (error) {
        console.error("get_company_list error:", error);

        res.status(500).json({
            error: "Failed to get company list",
            message: error.message
        });
    }
};
export const get_company_invoices = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            filter_type,
            company_id,
            partner_id,
            outstanding_balance,
            amount_paid_positive,
            aging
        } = req.query;

        const values = [];
        const conditions = [];

        /*
         * ==========================================
         * FILTER TANGGAL
         * kalau ada filter aging, JANGAN ikut filter tanggal invoice_date —
         * aging analysis itu soal jatuh tempo (invoice_date_due) relatif
         * terhadap HARI INI, bukan soal rentang tanggal invoice yang lagi
         * dipilih di halaman
         * ==========================================
         */

        if (start_date && !aging) {
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

        if (end_date && !aging) {
            if (filter_type === "month") {
                // Contoh:
                // end_date = 2026-07
                //
                // Kita gunakan tanggal bulan berikutnya
                // dengan operator 
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
         * FILTER OUTSTANDING BALANCE
         * ==========================================
         */

        if (outstanding_balance === "true" || outstanding_balance === true) {
            conditions.push(`amount_residual > 0`);
        }

        /*
         * ==========================================
         * FILTER AMOUNT PAID POSITIVE
         * ==========================================
         */

        if (amount_paid_positive === "true" || amount_paid_positive === true) {
            conditions.push(`(amount_total - amount_residual) > 0`);
        }

        /*
         * ==========================================
         * FILTER AGING (jatuh tempo terhadap invoice_date_due)
         * ==========================================
         */

        if (aging === "0-30") {
            conditions.push(`(CURRENT_DATE - invoice_date_due) <= 30`);
            conditions.push(`payment_state = 'not_paid'`);
        } else if (aging === "31-60") {
            conditions.push(`(CURRENT_DATE - invoice_date_due) BETWEEN 31 AND 60`);
            conditions.push(`payment_state = 'not_paid'`);
        } else if (aging === "61-90") {
            conditions.push(`(CURRENT_DATE - invoice_date_due) BETWEEN 61 AND 90`);
            conditions.push(`payment_state = 'not_paid'`);
        } else if (aging === ">90") {
            conditions.push(`(CURRENT_DATE - invoice_date_due) > 90`);
            conditions.push(`payment_state = 'not_paid'`);
        }

        /*
         * ==========================================
         * FILTER invoice_origin & amount_total — dipindah masuk ke
         * conditions (bukan di-hardcode terpisah setelah whereClause),
         * supaya query tetap valid kalau conditions lain kosong semua
         * ==========================================
         */

        conditions.push(`state = 'posted'`);
        conditions.push(`move_type = 'out_invoice'`);
        conditions.push(`invoice_origin IS NOT NULL`);
        conditions.push(`jsonb_typeof(invoice_origin) = 'array'`);
        conditions.push(`jsonb_array_length(invoice_origin) > 0`);
        conditions.push(`amount_total > 0`);

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
            select invoice_date,partner_id->>1 customer_name,company_id->>1 company_name,amount_total,amount_tax,(amount_total-amount_residual) amount_paid,amount_residual,payment_state,invoice_date_due,invoice_origin
            from invoices ${whereClause}
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
            `amount_total>0 and TO_CHAR(invoice_date,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
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
            AND state='posted'
            AND move_type='out_invoice'
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
                (invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 year')
                AND invoice_date <= (CURRENT_DATE - INTERVAL '1 year'))
            ) AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
            AND state='posted'
            AND move_type='out_invoice'`
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
            WITH totals AS (
                SELECT
                    SUM(
                        CASE WHEN invoice_date >= date_trunc('month', CURRENT_DATE) 
                            AND invoice_date <= CURRENT_DATE 
                        THEN amount_total ELSE 0 END
                    ) AS total_bulan_ini,
                    SUM(
                        CASE WHEN invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 year')
                            AND invoice_date <= (CURRENT_DATE - INTERVAL '1 year')
                        THEN amount_total ELSE 0 END
                    ) AS total_bulan_lalu
                FROM invoices 
                WHERE ${whereClause}
            )
            SELECT
                total_bulan_ini,
                total_bulan_lalu,
                CASE
                    WHEN total_bulan_lalu = 0 AND total_bulan_ini = 0 THEN 0
                    WHEN total_bulan_lalu = 0 AND total_bulan_ini > 0 THEN 100
                    ELSE ROUND(
                        (total_bulan_ini - total_bulan_lalu) / NULLIF(total_bulan_lalu, 0) * 100,
                        2
                    )
                END AS persen_perubahan,
                -- Label bulan ini, contoh: "1 September 2026 - Today"
                to_char(date_trunc('month', CURRENT_DATE), 'FMDD') || ' ' ||
                (ARRAY['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'])[EXTRACT(MONTH FROM CURRENT_DATE)::int] || ' ' ||
                EXTRACT(YEAR FROM CURRENT_DATE)::int || ' - Today' AS label_bulan_ini,
                -- Label bulan lalu (periode sama, tahun sebelumnya), contoh: "1-13 Agu 2025"
                to_char(date_trunc('month', CURRENT_DATE - INTERVAL '1 year'), 'FMDD') || '-' ||
                to_char((CURRENT_DATE - INTERVAL '1 year')::date, 'FMDD') || ' ' ||
                (ARRAY['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'])[EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 year'))::int] || ' ' ||
                EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 year'))::int AS label_bulan_lalu
            FROM totals;
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
                AND state='posted'
                AND move_type='out_invoice'
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
                AND state='posted'
                AND move_type='out_invoice'
                ${extraWhere}
            )
            SELECT
                COALESCE(periode_ini.total, 0) AS total_tahun_ini,
                COALESCE(periode_lalu.total, 0) AS total_tahun_lalu,
                ROUND(
                    ((COALESCE(periode_ini.total, 0) - COALESCE(periode_lalu.total, 0))
                    / COALESCE(periode_lalu.total, 1)) * 100, 2
                ) AS persen_perubahan,
                to_char(DATE_TRUNC('year', CURRENT_DATE), 'FMDD') || ' Januari ' || EXTRACT(YEAR FROM CURRENT_DATE)::int || ' - Today' AS label_tahun_ini,
                to_char(DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year', 'FMDD') || ' Jan-' ||
                to_char(CURRENT_DATE - INTERVAL '1 year', 'FMDD') || ' ' ||
                (ARRAY['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'])[EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 year'))::int] || ' ' ||
                EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 year'))::int AS label_tahun_lalu
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
                AND state='posted'
                AND move_type='out_invoice'
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
export const get_invoice_stats_mtd = async (req, res) => {
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
                invoice_date::date AS date,
                SUM(SUM(amount_total)) OVER (
                    PARTITION BY date_trunc('month', invoice_date)
                    ORDER BY invoice_date::date
                ) AS amount_total
            FROM invoices
            WHERE (
                (
                    invoice_date >= date_trunc('month', CURRENT_DATE)
                    AND invoice_date <= CURRENT_DATE
                ) OR (
                    invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 year')
                    AND invoice_date <= (CURRENT_DATE - INTERVAL '1 year')
                )
            )
            AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
            AND state='posted'
            AND move_type='out_invoice'
            ${extraWhere}
            GROUP BY invoice_date::date
            ORDER BY invoice_date::date;
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

        conditions.push(`state = 'posted'`);

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
    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }
    let selectField = `
        company_id[1] AS label,
        SUM(amount_total) AS total_amount
    `;

    let groupField = `
        ,company_id[1],company_id[0]
    `;

    let fromTable = `
        invoices
    `;

    let extraJoin = "";
    let extraWhere = "";
    let totalAmountExpr = `SUM(amount_total)`;
    if (filter_by === "company") {
        selectField = `
            TO_CHAR(invoice_date,'${format}') AS label,
            SUM(amount_total) AS total_amount
        `;
        groupField = `,TO_CHAR(invoice_date,'${format}')`;
        totalAmountExpr = `SUM(amount_total)`;
    }
    if(filter_by === 'customer'){
        selectField = `
            company_id[1] company,
            company_id[0] company_id,
            partner_id[1] AS label,
            SUM(amount_total) AS total_amount
        `;

        groupField = `
            ,partner_id[1]
        `;
    }
    if (filter_by === "product") {

        selectField = `
            company_id[1] company,
            company_id[0] company_id,
            COALESCE(line->'product_template'->>'name', line->>'name') AS label,
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(line_count.total_lines, 0)
            ) AS total_amount
        `;

        groupField = `
            ,COALESCE(line->'product_template'->>'name', line->>'name')
        `;

        extraJoin = `
            CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
            CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
            CROSS JOIN LATERAL (
                SELECT COUNT(*) AS total_lines
                FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
                WHERE COALESCE((l2->>'quantity')::numeric, 0) <> 0
            ) AS line_count
        `;
        // baris tanpa quantity (mis. baris catatan/spesifikasi produk yang
        // menempel di sales order line tapi bukan baris bernilai sendiri)
        // ikut ke-exclude di sini — sama seperti get_top_products, supaya
        // produk yang sama tidak pecah jadi 2 "label" berbeda gara-gara
        // baris catatan itu ikut ke-GROUP BY sendiri
        extraWhere = `AND COALESCE((line->>'quantity')::numeric, 0) <> 0`;
        totalAmountExpr = `
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(line_count.total_lines, 0)
            )
        `;
    }
    if (filter_by === "brand") {
        const brandCaseSql = buildBrandLabelCaseSql();

        selectField = `
            company_id[1] company,
            company_id[0] company_id,
            ${brandCaseSql} AS label,
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(line_count.total_lines, 0)
            ) AS total_amount
        `;

        groupField = `
            ,${brandCaseSql}
        `;

        extraJoin = `
            CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
            CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
            CROSS JOIN LATERAL (
                SELECT COUNT(*) AS total_lines
                FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
                WHERE COALESCE((l2->>'quantity')::numeric, 0) <> 0
            ) AS line_count
        `;
        // baris tanpa quantity (catatan/spesifikasi) tetap di-exclude,
        // sama seperti mode "product"
        extraWhere = `AND COALESCE((line->>'quantity')::numeric, 0) <> 0`;
        totalAmountExpr = `
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(line_count.total_lines, 0)
            )
        `;
    }
    let baseQuery = `
        SELECT
            TO_CHAR(invoice_date,'${format}') AS write_date,
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

    conditions.push(`state = 'posted'`);
    conditions.push(`move_type = 'out_invoice'`);

    if (conditions.length > 0) {
        baseQuery += `
            WHERE ${conditions.join(" AND ")} AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
            ${extraWhere}
        `;
    }

    baseQuery += `
        GROUP BY
            TO_CHAR(invoice_date,'${format}'),
            company_id[1],
            company_id[0]
            ${groupField}
        HAVING ${totalAmountExpr} <> 0
    `;
    let query;
    if (filter_by === "product") {
        // Batasi hanya 10 produk teratas per company,
        // berdasarkan total keseluruhan periode, tapi tetap
        // pertahankan breakdown per write_date untuk chart tren.
        query = `
            WITH grouped AS (
                ${baseQuery}
            ),
            totals AS (
                SELECT
                    company_id,
                    label,
                    SUM(total_amount) AS total_amount
                FROM grouped
                GROUP BY company_id, label
            ),
            ranked AS (
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY company_id
                        ORDER BY total_amount DESC
                    ) AS rn
                FROM totals
            )
            SELECT
                g.write_date,
                g.company,
                g.company_id,
                g.label,
                g.total_amount
            FROM grouped g
            JOIN ranked r
                ON r.company_id = g.company_id
                AND r.label = g.label
                AND r.rn <= 10
            ORDER BY
                g.company_id,
                g.total_amount DESC,
                g.write_date;
        `;
    } else {
        query = `
            ${baseQuery}
            ORDER BY
                TO_CHAR(invoice_date,'${format}');
        `;
    }
    try {
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
                categ_name,
                total_amount,
                total_qty,
                ROUND(
                    total_amount * 100.0 / NULLIF(SUM(total_amount) OVER (), 0),
                    2
                ) AS percentage
            FROM (
                SELECT 
                    CASE
                        WHEN jsonb_typeof(line->'product_template'->'categ_id') = 'array'
                            THEN (line->'product_template'->'categ_id'->>0)::int
                        ELSE 0
                    END AS categ_id,
                    CASE
                        WHEN jsonb_typeof(line->'product_template'->'categ_id') = 'array'
                            THEN TRIM(
                                split_part(
                                    line->'product_template'->'categ_id'->>1,
                                    '/',
                                    array_length(string_to_array(line->'product_template'->'categ_id'->>1, '/'), 1)
                                )
                            )
                        ELSE 'No Category'
                    END AS categ_name,
                    SUM(
                        (line->>'price_subtotal')::numeric
                        + (amount_tax / NULLIF(line_count.total_lines, 0))
                    ) AS total_amount,
                    SUM((line->>'quantity')::numeric) AS total_qty
                FROM invoices
                CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
                CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
                CROSS JOIN LATERAL (
                    SELECT COUNT(*) AS total_lines
                    FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                    CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
                    WHERE COALESCE((l2->>'quantity')::numeric, 0) <> 0
                ) AS line_count
                ${whereClause}
                AND state = 'posted'
                AND move_type='out_invoice'
                AND line->'product_template' IS NOT NULL
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                AND COALESCE((line->>'quantity')::numeric, 0) <> 0
                GROUP BY
                    CASE
                        WHEN jsonb_typeof(line->'product_template'->'categ_id') = 'array'
                            THEN (line->'product_template'->'categ_id'->>0)::int
                        ELSE 0
                    END,
                    CASE
                        WHEN jsonb_typeof(line->'product_template'->'categ_id') = 'array'
                            THEN TRIM(
                                split_part(
                                    line->'product_template'->'categ_id'->>1,
                                    '/',
                                    array_length(string_to_array(line->'product_template'->'categ_id'->>1, '/'), 1)
                                )
                            )
                        ELSE 'No Category'
                    END
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
                    COALESCE(line->'product_template'->>'name', line->>'name') AS product_name,
                    SUM(
                        (line->>'price_subtotal')::numeric
                        + (amount_tax / NULLIF(line_count.total_lines, 0))
                    ) AS total_amount,
                    SUM((line->>'quantity')::numeric) AS total_qty
                FROM invoices
                CROSS JOIN LATERAL jsonb_array_elements(invoice_origin) AS origin
                CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
                CROSS JOIN LATERAL (
                    SELECT COUNT(*) AS total_lines
                    FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                    CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
                    WHERE COALESCE((l2->>'quantity')::numeric, 0) <> 0
                ) AS line_count
                ${whereClause}
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                AND COALESCE((line->>'quantity')::numeric, 0) <> 0
                AND state='posted'
                AND move_type='out_invoice'
                GROUP BY
                    (company_id->>0)::integer,
                    company_id->>1,
                    COALESCE(line->'product_template'->>'name', line->>'name')
                HAVING SUM((line->>'quantity')::numeric) > 0
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
                CASE
                    WHEN jsonb_typeof(partner_id) = 'array' THEN (partner_id->>0)::integer
                    ELSE 0
                END AS partner_id,
                CASE
                    WHEN jsonb_typeof(partner_id) = 'array' THEN partner_id->>1
                    ELSE 'No Customer'
                END AS customer_name,
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
            ${whereClause}
                AND invoice_origin IS NOT NULL
                AND jsonb_typeof(invoice_origin) = 'array'
                AND jsonb_array_length(invoice_origin) > 0
                AND EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements(invoices.invoice_origin) AS o2
                    CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
                    WHERE COALESCE((l2->>'quantity')::numeric, 0) <> 0
                )
                AND state='posted'
                AND move_type='out_invoice'
            GROUP BY
                (company_id->>0)::integer,
                company_id->>1,
                CASE
                    WHEN jsonb_typeof(partner_id) = 'array' THEN (partner_id->>0)::integer
                    ELSE 0
                END,
                CASE
                    WHEN jsonb_typeof(partner_id) = 'array' THEN partner_id->>1
                    ELSE 'No Customer'
                END
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
            AND state='posted'
            AND move_type='out_invoice'
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
         * KOLOM COMPANY — hanya disertakan di SELECT/GROUP BY
         * kalau company_id dikirim (bukan '' / kosong). Saat
         * company_id kosong (tampilan ALL COMPANY), brand di-
         * agregasi GABUNG lintas company, bukan dipecah per company.
         * ==========================================
         */

        const selectCompanyFields = company_id
            ? `(company_id->>0)::integer AS company_id,
                company_id->>1 AS company_name,`
            : "";

        const groupByCompanyFields = company_id
            ? `(company_id->>0)::integer,
                company_id->>1,`
            : "";

        /*
         * ==========================================
         * QUERY TOP BRANDS
         * ==========================================
         */

        const query = `
            SELECT
                ${selectCompanyFields}
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
                    WHEN line->>'name' ILIKE '%PANASONIC%' THEN 'PANASONIC'
                    WHEN line->>'name' ILIKE '%HOT WHEELS%' THEN 'HOT WHEELS'
                    WHEN line->>'name' ILIKE '%HOTWHEELS%' THEN 'HOT WHEELS'
                    WHEN line->>'name' ILIKE '%BARBIE%' THEN 'BARBIE'
                    WHEN line->>'name' ILIKE '%SAMSAM%' THEN 'PAWS NOVA'
                    WHEN line->>'name' ILIKE '%SAMSAMX%' THEN 'PAWS NOVA'
                    WHEN line->>'name' ILIKE '%AMERICAN APPAREL%' THEN 'AMERICAN APPAREL'
                    WHEN line->>'name' ILIKE '%GILDAN%' THEN 'GILDAN'
                    ELSE 'No Brand'
                END AS brand_name,
                SUM(
                    (line->>'price_subtotal')::numeric
                    + amount_tax / NULLIF(line_count.total_lines, 0)
                ) AS total_amount,
                SUM((line->>'quantity')::numeric) AS total_qty,
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
                WHERE COALESCE((l2->>'quantity')::numeric, 0) <> 0
            ) AS line_count
            ${whereClause} AND COALESCE((line->>'quantity')::numeric, 0) <> 0
            AND line->'product_template' IS NOT NULL
            AND invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
            AND state='posted'
            AND move_type='out_invoice'
            GROUP BY
                ${groupByCompanyFields}
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
                    WHEN line->>'name' ILIKE '%PANASONIC%' THEN 'PANASONIC'
                    WHEN line->>'name' ILIKE '%HOT WHEELS%' THEN 'HOT WHEELS'
                    WHEN line->>'name' ILIKE '%HOTWHEELS%' THEN 'HOT WHEELS'
                    WHEN line->>'name' ILIKE '%BARBIE%' THEN 'BARBIE'
                    WHEN line->>'name' ILIKE '%SAMSAM%' THEN 'PAWS NOVA'
                    WHEN line->>'name' ILIKE '%SAMSAMX%' THEN 'PAWS NOVA'
                    WHEN line->>'name' ILIKE '%AMERICAN APPAREL%' THEN 'AMERICAN APPAREL'
                    WHEN line->>'name' ILIKE '%GILDAN%' THEN 'GILDAN'
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
export const get_products = async (req, res) => {
    const {
        start_date,
        end_date,
        filter_type,
        company_id,
        brand_name,
        category,
        product_name
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
            conditions.push(`invoice_date >= $${values.length}::date`);
        } else if (filter_type === "year") {
            values.push(`${start_date}-01-01`);
            conditions.push(`invoice_date >= $${values.length}::date`);
        } else {
            values.push(start_date);
            conditions.push(`invoice_date >= $${values.length}::date`);
        }
    }

    if (end_date) {
        if (filter_type === "month") {
            values.push(`${end_date}-01`);
            conditions.push(`invoice_date < ($${values.length}::date + INTERVAL '1 month')`);
        } else if (filter_type === "year") {
            values.push(`${end_date}-01-01`);
            conditions.push(`invoice_date < ($${values.length}::date + INTERVAL '1 year')`);
        } else {
            values.push(end_date);
            conditions.push(`invoice_date < ($${values.length}::date + INTERVAL '1 day')`);
        }
    }

    /*
     * ==========================================
     * FILTER COMPANY
     * ==========================================
     */
    if (company_id) {
        values.push(Number(company_id));
        conditions.push(`(company_id->>0)::integer = $${values.length}`);
    }

    /*
     * ==========================================
     * FILTER invoice_origin
     * ==========================================
     */
    conditions.push(`state = 'posted'`);
    conditions.push(`move_type = 'out_invoice'`);
    conditions.push(`invoice_origin IS NOT NULL`);
    conditions.push(`jsonb_typeof(invoice_origin) = 'array'`);
    conditions.push(`jsonb_array_length(invoice_origin) > 0`);

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    /*
     * ==========================================
     * FILTER BRAND, CATEGORY & PRODUCT_NAME — diterapkan di
     * lineConditions (level line, bukan level invoice), karena
     * x_studio_brand/categ_id/name ada di dalam tiap baris produk,
     * bukan di tabel invoices
     * ==========================================
     */
    const lineConditions = [
        `COALESCE((line->>'quantity')::numeric, 0) <> 0`,
        // sebagian baris tidak punya product_template (mis. baris bebas/
        // manual) — nama produknya jatuh ke line->>'name'. Syaratnya
        // dilonggarkan supaya baris begini tidak ikut ke-exclude, selama
        // masih ada nama yang bisa dipakai (dari salah satu sumber)
        `COALESCE(line->'product_template'->>'name', line->>'name') IS NOT NULL`,
    ];

    if (brand_name) {
        if (brand_name === 'No Brand') {
            const notLikeConditions = Object.values(brandKeywordMap)
                .flat()
                .map(keyword => `(line->>'name') NOT ILIKE '%${keyword}%'`)
                .join(' AND ');

            lineConditions.push(
                `(
                    (line->'product_template'->'x_studio_brand') = 'false'::jsonb
                    OR jsonb_typeof(line->'product_template'->'x_studio_brand') != 'array'
                )
                AND ${notLikeConditions}`
            );
        } else if (fallbackBrandNames.includes(brand_name)) {
            const keywords = brandKeywordMap[brand_name];
            const nameConditions = keywords
                .map(keyword => {
                    values.push(`%${keyword}%`);
                    return `(line->>'name') ILIKE $${values.length}`;
                })
                .join(' OR ');

            lineConditions.push(
                `(
                    (jsonb_typeof(line->'product_template'->'x_studio_brand') = 'array'
                        AND (line->'product_template'->'x_studio_brand'->>1) ILIKE $${(() => {
                            values.push(`%${brand_name}%`);
                            return values.length;
                        })()})
                    OR
                    (jsonb_typeof(line->'product_template'->'x_studio_brand') != 'array'
                        AND (${nameConditions}))
                )`
            );
        } else {
            values.push(`%${brand_name}%`);
            lineConditions.push(
                `(line->'product_template'->'x_studio_brand'->>1) ILIKE $${values.length}`
            );
        }
    }

    if (category) {
        if (category === 'No Category') {
            // sama seperti "No Brand" — produk tanpa kategori itu
            // categ_id-nya bukan array (null, atau nilai lain seperti
            // false), persis logika ELSE di get_top_category
            lineConditions.push(
                `jsonb_typeof(line->'product_template'->'categ_id') IS DISTINCT FROM 'array'`
            );
        } else {
            values.push(category);
            lineConditions.push(
                `TRIM(
                    regexp_replace(
                        line->'product_template'->'categ_id'->>1,
                        '^.*/',
                        ''
                    )
                ) = $${values.length}`
            );
        }
    }

    if (product_name) {
        values.push(product_name);
        lineConditions.push(
            // product_name yang dikirim dari frontend bisa berasal dari
            // line->'product_template'->>'name' (kasus normal) ATAU dari
            // fallback line->>'name' (kalau product_template kosong) —
            // cocokkan ke keduanya lewat COALESCE, sama seperti logika di
            // get_top_products
            `COALESCE(line->'product_template'->>'name', line->>'name') = $${values.length}`
        );
    }

    /*
     * ==========================================
     * QUERY PRODUCTS (flatten invoice_origin[].lines[])
     * ==========================================
     */
    const query = `
        SELECT
            i.company_id->>0 AS company_id,
            i.company_id->>1 AS company_name,
            i.partner_id->>0 AS customer_id,
            i.partner_id->>1 AS customer_name,
            (EXTRACT(DAY FROM i.invoice_date)::int)::text || ' ' ||
            (ARRAY['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'])[EXTRACT(MONTH FROM i.invoice_date)::int] || ' ' ||
            (EXTRACT(YEAR FROM i.invoice_date)::int)::text AS date,
            COALESCE(line->'product_template'->>'name', line->>'name') AS product_name,
            CASE
                WHEN jsonb_typeof(line->'product_template'->'categ_id') = 'array'
                    THEN TRIM(
                        regexp_replace(
                            line->'product_template'->'categ_id'->>1,
                            '^.*/',
                            ''
                        )
                    )
                ELSE 'No Category'
            END AS category,
            line->'product_template'->'x_studio_brand' AS brand,
            (line->>'price_unit')::numeric AS price_unit,
            (line->>'quantity')::numeric AS quantity,
            (line->>'price_subtotal')::numeric AS price_subtotal,
            ROUND(i.amount_tax::numeric / NULLIF(line_count.total_lines, 0), 2) AS tax,
            ROUND(
                (line->>'price_subtotal')::numeric
                + (i.amount_tax::numeric / NULLIF(line_count.total_lines, 0)),
                2
            ) AS total_amount
        FROM invoices i
        CROSS JOIN LATERAL jsonb_array_elements(i.invoice_origin) AS origin
        CROSS JOIN LATERAL jsonb_array_elements(origin->'lines') AS line
        CROSS JOIN LATERAL (
            SELECT COUNT(*) AS total_lines
            FROM jsonb_array_elements(i.invoice_origin) AS o2
            CROSS JOIN LATERAL jsonb_array_elements(o2->'lines') AS l2
            WHERE COALESCE((l2->>'quantity')::numeric, 0) <> 0
        ) AS line_count
        ${whereClause}
        AND ${lineConditions.join(" AND ")}
        ORDER BY i.invoice_date, total_amount DESC
    `;
    try {
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error("get_products error:", error);
        res.status(500).json({
            error: "Failed to get products",
            message: error.message
        });
    }
};
export const get_companies = async (req, res) => {
    try {
        const query = `
            SELECT
                company_id
            FROM invoices WHERE invoice_origin IS NOT NULL
            AND jsonb_typeof(invoice_origin) = 'array'
            AND jsonb_array_length(invoice_origin) > 0
            GROUP BY
                company_id
            ORDER BY
                company_id
        `;

        const result = await pool.query(query);

        const companies = [
            { company_id: ["", "ALL COMPANY"] },
            ...result.rows
        ];

        return res.json(companies);

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
                    sales_order_number,
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
                        toJsonArray(r.invoice_line_ids),
                        [r.invoice_origin],
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