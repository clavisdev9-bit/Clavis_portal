import express from 'express';
import { get_sales, get_total_sales, get_total_orders, get_average_order, get_total_margin, get_margin_percent, get_delivery_full, get_sales_trend, get_top_customers, get_sales_person } from '../controllers/salesController.js';

const router = express.Router();
router.get('/master', get_sales);
router.get('/total_sales', get_total_sales);
router.get('/total_orders', get_total_orders);
router.get('/average_orders', get_average_order);
router.get('/total_margin', get_total_margin);
router.get('/margin_percent', get_margin_percent);
router.get('/delivery_full', get_delivery_full);
router.get('/get_sales_trend', get_sales_trend);
router.get('/get_top_customers', get_top_customers);
router.get('/get_sales_person', get_sales_person);

export default router;