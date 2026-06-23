import express from 'express';
import { get_customers } from '../controllers/customerController.js';
const router = express.Router();

router.get('/master',get_customers);
export default router;