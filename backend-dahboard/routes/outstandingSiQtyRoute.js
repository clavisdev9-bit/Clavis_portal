import express from 'express';
import { get_outstanding_si_qty } from '../controllers/outstandingSiQtyController.js';
const router = express.Router();

router.get('/master',get_outstanding_si_qty);
export default router;