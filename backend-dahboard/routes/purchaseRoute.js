import express from 'express';
import { get_purchase, get_supplier, get_total_purchase, get_total_amount, get_total_tax, get_number_of_item, get_purchase_invoice,get_purchase_trend, get_top_supplier, get_sales_person } from '../controllers/purchaseController.js';

const router = express.Router();
router.get('/master', get_purchase);
router.get('/supplier', get_supplier);
router.get('/total_purchase', get_total_purchase);
router.get('/total_amount', get_total_amount);
router.get('/total_tax', get_total_tax);
router.get('/number_of_item', get_number_of_item);
router.get('/purchase_invoice', get_purchase_invoice);
router.get('/purchase_trend', get_purchase_trend);
router.get('/top_supplier', get_top_supplier);
router.get('/sales_person', get_sales_person);

export default router;