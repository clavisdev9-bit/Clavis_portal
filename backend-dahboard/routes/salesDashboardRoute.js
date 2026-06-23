import express from 'express';
import { get_sales_dashboard } from '../controllers/salesDashboardController.js';
const router = express.Router();

router.get('/master',get_sales_dashboard);
export default router;