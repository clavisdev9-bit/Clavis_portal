import express from 'express';
import { get_pages, get_parent_pages, post_page, get_this_user_page_2,get_specific_page } from '../controllers/pageController.js';

const router = express.Router();
router.get('/get_pages', get_pages);
router.get('/get_parent_pages', get_parent_pages);
router.post('/post_page', post_page);
router.get('/get_this_user_page_2', get_this_user_page_2);
router.get('/get_specific_page', get_specific_page);
export default router;