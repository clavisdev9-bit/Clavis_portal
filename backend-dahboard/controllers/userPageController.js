import pool from '../db.js';
export const get_user_pages=async(req, res)=>{
    const pages=await pool.query('SELECT * FROM user_page_managements');
    res.json(pages);
}
export const get_this_user_page = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ message: 'user_id is required' });
        }
        const result = await pool.query(
            'SELECT id_page FROM user_page_managements WHERE id_user = $1',
            [user_id]
        );
        const pages = result.rows.map(row => row.id_page);
        res.json(pages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
export const post_user_page = async (req, res) => {
    try {
        const { id_user, id_page } = req.body;

        const result = await pool.query(
            `INSERT INTO user_page_managements (id_user, id_page)
             VALUES ($1, $2)
             ON CONFLICT (id_user)
             DO UPDATE SET id_page = EXCLUDED.id_page
             RETURNING *`,
            [id_user, id_page]
        );

        res.json({
            message: 'User pages saved successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};