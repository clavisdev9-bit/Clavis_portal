import express from 'express';
import { get_order_dashboard } from '../controllers/orderDashboardController.js';
const router = express.Router();

router.get('/master',get_order_dashboard);
export default router;