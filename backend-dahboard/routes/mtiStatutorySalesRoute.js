import express from 'express';
import { get_mti_statutory_sales } from '../controllers/mtiStatutorySalesController.js';
const router = express.Router();

router.get('/master',get_mti_statutory_sales);
export default router;