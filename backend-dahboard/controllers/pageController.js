import pool from '../db.js';
export const get_pages=async(req, res)=>{
    const pages=await pool.query('select a.id,a.page_name,a.page_label,a.logo,a.level,a.parent parent_id,b.page_label parent from page_managements a left join page_managements b on a.parent=b.id order by a.id');
    res.json(pages);
}
export const get_specific_page=async(req, res)=>{
    const { id_page } = req.query;
    const page=await pool.query('SELECT * FROM page_managements where id = $1',[id_page]);
    res.json(page);
}
export const get_parent_pages=async(req, res)=>{
    const parent_pages=await pool.query('SELECT * FROM page_managements where level=1');
    res.json(parent_pages);
}
export const post_page = async (req, res) => {
    try {
        let { id, page_name, page_label,logo, level, parent } = req.body;

        // 🔥 default parent
        if (parent === '' || parent == null) {
            parent = 0;
        }

        let result;

        // ✅ UPDATE
        if (id!=='NEW DATA') {
            result = await pool.query(
                `UPDATE page_managements
                 SET page_name = $1,
                     page_label = $2,
                     logo = $3,
                     level = $4,
                     parent = $5,
                     updated_at = NOW()
                 WHERE id = $6
                 RETURNING *`,
                [page_name, page_label, logo, level, parent, id]
            );

        } else {
            // ✅ INSERT
            result = await pool.query(
                `INSERT INTO page_managements
                 (page_name, page_label, logo, level, parent)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [page_name, page_label, logo, level, parent]
            );
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error'
        });
    }
};
export const get_this_user_page_2 = async (req, res) => { 
    try {
        const { id_page } = req.query;

        if (!id_page) {
            return res.status(400).json({ message: 'id_page is required' });
        }

        const idArray = id_page.split(',').map(Number);

        const result = await pool.query(
            'SELECT * FROM page_managements WHERE id = ANY($1) order by id',
            [idArray]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};