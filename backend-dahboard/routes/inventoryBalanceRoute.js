import express from 'express';
import { get_inventory_balances } from '../controllers/inventoryBalanceController.js';
const router = express.Router();

router.get('/master',get_inventory_balances);
export default router;