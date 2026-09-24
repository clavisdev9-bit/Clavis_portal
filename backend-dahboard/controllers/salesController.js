import pool from '../db.js';
import dayjs from 'dayjs';
const BASE_URL=process.env.CLAVIS_BASE_URL;
const brandKeywordMap = {
    'PANASONIC': ['PANASONIC'],
    'HOT WHEELS': ['HOT WHEELS', 'HOTWHEELS'],
    'BARBIE': ['BARBIE'],
    'AMERICAN APPAREL': ['AMERICAN APPAREL'],
    'PAWS NOVA': ['SAMSAM', 'SAMSAMX'],
    'GILDAN': ['GILDAN'],
};
const fallbackBrandNames = Object.keys(brandKeywordMap);function buildBrandLabelCaseSql() {
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
export const get_sales_stats_mtd = async (req, res) => {
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
                date_order::date AS date,
                SUM(SUM(amount_total)) OVER (
                    PARTITION BY date_trunc('month', date_order::date)
                    ORDER BY date_order::date
                ) AS amount_total
            FROM sales_orders
            WHERE ((
                date_order >= date_trunc('month', CURRENT_DATE)
                AND date_order <= CURRENT_DATE
            ) OR (
                date_order >= date_trunc('month', CURRENT_DATE - INTERVAL '1 year')
                AND date_order <= (CURRENT_DATE - INTERVAL '1 year')
            ))
            ${extraWhere}
            GROUP BY date_order::date
            ORDER BY date_order::date;
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
            invoice_status,
            delivery_status
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
        if (delivery_status) {
            values.push(delivery_status);

            conditions.push(
                `delivery_status = $${values.length}`
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
            select date_order,delivery_date,partner_id->>1 customer_name,company_id->>1 company_name,amount_total,amount_tax,order_line,invoice_status,delivery_status from sales_orders ${whereClause} AND amount_total>0
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
        const whereClause2 =
            company_id
                ? `WHERE company_id->>0='${company_id}'`
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
                ${whereClause2}
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
                        + COUNT(*) FILTER (WHERE invoice_status = 'to invoice')
			            + COUNT(*) FILTER (WHERE invoice_status = 'no'),
                        0
                    ),
                    2
                ) AS percentage_invoiced
            FROM sales_orders
            ${whereClause} and amount_total>0
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
                TO_CHAR(date_order,'${format}') AS write_date,
                company_id[1] AS company_name,
                SUM(amount_total) AS total_amount
            FROM 
                sales_orders
            WHERE 
                TO_CHAR(date_order,'${format}') = $1
            GROUP BY
                TO_CHAR(date_order,'${format}'),
                company_id[1]
            HAVING SUM(amount_total) <> 0
            ORDER BY
                TO_CHAR(date_order,'${format}');
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
            `amount_total>0 and TO_CHAR(date_order,'${format}') BETWEEN $${values.length - 1} AND $${values.length}`
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
        company_id[1] AS label,
        SUM(amount_total) AS total_amount
    `;

    let groupField = `
        ,company_id[1],company_id[0]
    `;

    let fromTable = `
        sales_orders
    `;

    let extraJoin = "";
    let totalAmountExpr = `SUM(amount_total)`;
    let companyGroupBy = `, company_id[1], company_id[0]`;
    
    let format = "YYYY-MM-DD";

    if (filter_type === "month") {
        format = "YYYY-MM";
    } else if (filter_type === "year") {
        format = "YYYY";
    }
    
    if (filter_by === "company") {
        selectField = `
            TO_CHAR(date_order,'${format}') AS label,
            SUM(amount_total) AS total_amount
        `;
        groupField = `,TO_CHAR(date_order,'${format}') `;
        totalAmountExpr = `SUM(amount_total)`;
        companyGroupBy = ``; // ✅ mode 'company' = total gabungan semua company, jangan di-group per company
    }
    if (filter_by === 'customer') {
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
        const brandCaseSql = buildBrandLabelCaseSql();

        selectField = `
            company_id[1] company,
            company_id[0] company_id,
            ${brandCaseSql} AS label,
            SUM(
                (line->>'price_subtotal')::numeric
                + amount_tax::numeric / NULLIF(jsonb_array_length(order_line), 0)
            ) AS total_amount
        `;
        groupField = `
            ,${brandCaseSql}
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

    let baseQuery = `
        SELECT
            TO_CHAR(date_order,'${format}') AS write_date,
            ${selectField}
        FROM ${fromTable}
        ${extraJoin}
    `;

    const values = [];
    const conditions = [];

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
    if (company_id) {
        values.push(company_id);
        conditions.push(`company_id[0] = $${values.length}`);
    }
    if (conditions.length > 0) {
        baseQuery += `
            WHERE ${conditions.join(" AND ")}
        `;
    }

    baseQuery += `
        GROUP BY
            TO_CHAR(date_order,'${format}')
            ${companyGroupBy}
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
                TO_CHAR(date_order,'${format}');
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
        FROM sales_orders
    `;

    const values = [];

    if (start_date && end_date) {
        query += `
            WHERE TO_CHAR(date_order,'${format}') BETWEEN $1 AND $2
        `;
        values.push(start_date, end_date);
    } else {
        // Default: 7 hari terakhir
        query += `
            WHERE DATE(date_order) IN (
                SELECT DISTINCT DATE(date_order)
                FROM sales_orders
                ORDER BY DATE(date_order) DESC
                LIMIT 7
            )
        `;
    }
    query += `GROUP BY company_id[1];`;
    const result = await pool.query(query, values);

    res.json(result.rows);
};
export const get_products = async (req, res) => {
    const {
        start_date,
        end_date,
        filter_type,
        company_id,
        brand_name,
        category,
        product_name,
        partner_id,
        invoice_status,
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
            conditions.push(`date_order >= $${values.length}::date`);
        } else if (filter_type === "year") {
            values.push(`${start_date}-01-01`);
            conditions.push(`date_order >= $${values.length}::date`);
        } else {
            values.push(start_date);
            conditions.push(`date_order >= $${values.length}::date`);
        }
    }

    if (end_date) {
        if (filter_type === "month") {
            values.push(`${end_date}-01`);
            conditions.push(`date_order < ($${values.length}::date + INTERVAL '1 month')`);
        } else if (filter_type === "year") {
            values.push(`${end_date}-01-01`);
            conditions.push(`date_order < ($${values.length}::date + INTERVAL '1 year')`);
        } else {
            values.push(end_date);
            conditions.push(`date_order < ($${values.length}::date + INTERVAL '1 day')`);
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

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    /*
     * ==========================================
     * FILTER BRAND, CATEGORY & PRODUCT_NAME — diterapkan di
     * lineConditions (level line, bukan level order), karena
     * x_studio_brand/categ_id/name ada di dalam tiap baris produk,
     * bukan di tabel sales_orders
     * ==========================================
     */
    const lineConditions = [
        `COALESCE((line->>'po_qty')::numeric, 0) <> 0`,
        `line->'product_template' IS NOT NULL`,
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

    if (product_name) {
        values.push(product_name);
        lineConditions.push(
            `line->'product_template'->>'name' = $${values.length}`
        );
    }
    if (partner_id) {
        values.push(partner_id);
        lineConditions.push(
            `partner_id->>0 = $${values.length}`
        );
    }
    if (invoice_status) {
        values.push(invoice_status);

        lineConditions.push(
            `invoice_status = $${values.length}`
        );
    }

    /*
     * ==========================================
     * QUERY PRODUCTS (flatten order_line[])
     * ==========================================
     */
    const query = `
        SELECT
            so.company_id->>0 AS company_id,
            so.company_id->>1 AS company_name,
            so.partner_id->>0 AS customer_id,
            so.partner_id->>1 AS customer_name,
	        so.name,
            so.date_order write_date,
            (EXTRACT(DAY FROM so.date_order)::int)::text || ' ' ||
            (ARRAY['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'])[EXTRACT(MONTH FROM so.date_order)::int] || ' ' ||
            (EXTRACT(YEAR FROM so.date_order)::int)::text AS date,
            line->'product_template'->>'name' AS product_name,
            TRIM(
                regexp_replace(
                    line->'product_template'->'categ_id'->>1,
                    '^.*/',
                    ''
                )
            ) AS category,
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
            END AS brand,
            (line->>'price_unit')::numeric AS price_unit,
            (line->>'po_qty')::numeric AS quantity,
            (line->>'dl_qty')::numeric AS quantity_do,
            (line->>'price_subtotal')::numeric AS price_subtotal,
            ROUND(so.amount_tax::numeric / NULLIF(line_count.total_lines, 0), 2) AS tax,
            ROUND(
                (line->>'price_subtotal')::numeric
                + (so.amount_tax::numeric / NULLIF(line_count.total_lines, 0)),
                2
            ) AS total_amount
        FROM sales_orders so
        CROSS JOIN LATERAL jsonb_array_elements(so.order_line) AS line
        CROSS JOIN LATERAL (
            SELECT COUNT(*) AS total_lines
            FROM jsonb_array_elements(so.order_line) AS l2
            WHERE COALESCE((l2->>'po_qty')::numeric, 0) <> 0
        ) AS line_count
        ${whereClause}
        AND ${lineConditions.join(" AND ")}
        ORDER BY so.date_order, total_amount DESC
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
            FROM sales_orders
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
export const get_fti_sales = async (req, res) => {
    try {
        const {
            start_date,
            end_date
        } = req.query;

        let query = `
            select so.type_name, so.partner_id->>1 customer_name, so.client_order_ref, name, so.partner_shipping_id, so.delivery_date,  line->'po_qty' so_qty, line->'dl_qty' delivered_qty, 
            COALESCE(
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
            ) brand, line->'product_template'->>'name' product_name, line->'unit'->>1 uom, line->'price_unit' price_unit, line->'price_subtotal' price_subtotal, line->'tax'->>0 so_vat 
            from sales_orders so CROSS JOIN LATERAL jsonb_array_elements(so.order_line) AS line
            where company_id->>0='3'
            AND TRIM(
                regexp_replace(
                    line->'product_template'->'categ_id'->>1,
                    '^.*/',
                    ''
                )
            ) = 'FINETODAY'
            and so.type_name='Sales Order'
        `;

        const params = [];

        if (start_date && end_date) {
            params.push(start_date, end_date);
            query += ` AND so.delivery_date >= $${params.length - 1} AND so.delivery_date <= $${params.length}`;
        }

        const result = await pool.query(query, params);

        res.json(result.rows);

    } catch (error) {
        console.error("get_fti_sales error:", error);

        return res.status(500).json({
            status: false,
            message: "Gagal mengambil data fti sales",
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

            FROM sales_orders

            ${whereClause}

            GROUP BY
                (company_id->>0)::integer,
                company_id->>1,
                (partner_id->>0)::integer,
                partner_id->>1
            HAVING SUM(amount_total) > 0
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
                        + (so.amount_tax / NULLIF(vc.valid_line_count, 0))
                    ) AS total_amount,
                    SUM((elem->>'po_qty')::numeric) AS total_qty
                FROM sales_orders so,
                LATERAL jsonb_array_elements(so.order_line) AS elem,
                LATERAL (
                    SELECT COUNT(*) AS valid_line_count
                    FROM jsonb_array_elements(so.order_line) e2
                    WHERE COALESCE((e2->>'po_qty')::numeric, 0) <> 0
                ) vc
                ${whereClause}
                AND elem->'product_template'->'categ_id' IS NOT NULL
                AND COALESCE((elem->>'po_qty')::numeric, 0) <> 0
                GROUP BY categ_id, categ_name
                HAVING SUM(
                    (elem->>'price_subtotal')::numeric 
                    + (so.amount_tax / NULLIF(vc.valid_line_count, 0))
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
                (date_order >= date_trunc('month', CURRENT_DATE - INTERVAL '1 year')
                AND date_order <= (CURRENT_DATE - INTERVAL '1 year'))
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
            WITH totals AS (
                SELECT
                    SUM(
                        CASE WHEN date_order >= date_trunc('month', CURRENT_DATE) 
                            AND date_order <= CURRENT_DATE 
                        THEN amount_total ELSE 0 END
                    ) AS total_bulan_ini,
                    SUM(
                        CASE WHEN date_order >= date_trunc('month', CURRENT_DATE - INTERVAL '1 year')
                            AND date_order <= (CURRENT_DATE - INTERVAL '1 year')
                        THEN amount_total ELSE 0 END
                    ) AS total_bulan_lalu
                FROM sales_orders 
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
                    (so.company_id->>0)::integer AS company_id, 
                    so.company_id->>1 AS company_name,
                    elem->'product_template'->>'name' AS product_name,
                    SUM(
                        (elem->>'price_subtotal')::numeric 
                        + (so.amount_tax / NULLIF(vc.valid_line_count, 0))
                    ) AS total_amount,
                    SUM((elem->>'po_qty')::numeric) AS total_qty
                FROM sales_orders so,
                LATERAL jsonb_array_elements(so.order_line) AS elem,
                LATERAL (
                    SELECT COUNT(*) AS valid_line_count
                    FROM jsonb_array_elements(so.order_line) e2
                    WHERE COALESCE((e2->>'po_qty')::numeric, 0) <> 0
                ) vc
                ${whereClause}
                AND COALESCE((elem->>'po_qty')::numeric, 0) <> 0
                GROUP BY (so.company_id->>0)::integer, so.company_id->>1, product_name
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
         * KOLOM COMPANY — hanya disertakan di SELECT/GROUP BY
         * kalau company_id dikirim (bukan '' / kosong). Saat
         * company_id kosong (tampilan ALL COMPANY), brand di-
         * agregasi GABUNG lintas company, bukan dipecah per company.
         * ==========================================
         */

        const selectCompanyFields = company_id
            ? `(so.company_id->>0)::integer AS company_id,
                so.company_id->>1 AS company_name,`
            : "";

        const groupByCompanyFields = company_id
            ? `(so.company_id->>0)::integer,
                so.company_id->>1,`
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
                    + so.amount_tax / NULLIF(vc.valid_line_count, 0)
                ) AS total_amount,
                SUM((line->>'po_qty')::numeric) AS total_qty,
                ROUND(
                    SUM(
                        (line->>'price_subtotal')::numeric
                        + so.amount_tax / NULLIF(vc.valid_line_count, 0)
                    ) * 100.0
                    / NULLIF(
                        SUM(
                            SUM(
                                (line->>'price_subtotal')::numeric
                                + so.amount_tax / NULLIF(vc.valid_line_count, 0)
                            )
                        ) OVER (),
                        0
                    ),
                    2
                ) AS percentage
            FROM sales_orders so
            CROSS JOIN LATERAL jsonb_array_elements(so.order_line) AS line
            CROSS JOIN LATERAL (
                SELECT COUNT(*) AS valid_line_count
                FROM jsonb_array_elements(so.order_line) e2
                WHERE COALESCE((e2->>'po_qty')::numeric, 0) <> 0
            ) vc
            ${whereClause}
            AND (line->>'po_qty')::numeric > 0
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
                        client_order_ref,
                        write_uid
                    )
                    VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                        $11::jsonb,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,$19,$20,
                        $21,$22,$23,$24,$25,$26,$27::jsonb,
                        $28::jsonb,$29::jsonb,$30::jsonb,$31,$32,$33::jsonb,$34,$35::jsonb,$36::jsonb,
                        $37,$38::jsonb,$39,$40::jsonb,$41,$42,$43,$44,$45::jsonb
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
                        r.client_order_ref,
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