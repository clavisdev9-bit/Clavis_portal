import express from 'express';
import { get_sell_out_customers } from '../controllers/sellOutByCustomerController.js';
const router = express.Router();

router.get('/master',get_sell_out_customers);
export default router;