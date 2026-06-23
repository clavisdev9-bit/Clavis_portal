import express from 'express';
import { get_user_pages,post_user_page,get_this_user_page } from '../controllers/userPageController.js';

const router = express.Router();
router.get('/get_user_pages', get_user_pages);
router.get('/get_this_user_page', get_this_user_page);
router.post('/post_user_page', post_user_page);
export default router;