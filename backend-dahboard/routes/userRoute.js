import express from 'express';
import {login_user, register_user,send_reset_password, set_new_password, get_users } from '../controllers/userController.js';

const router = express.Router();
router.post('/register', register_user);
router.post('/login', login_user);
router.post('/send-reset-password', send_reset_password);
router.post('/set_new_password', set_new_password);
router.get('/get_users', get_users);
export default router;