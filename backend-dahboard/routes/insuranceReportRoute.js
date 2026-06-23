import express from 'express';
import { get_insurance_report } from '../controllers/insuranceReportController.js';
const router = express.Router();

router.get('/master',get_insurance_report);
export default router;