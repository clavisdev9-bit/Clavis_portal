import express from 'express';
import { get_outstanding_pr } from '../controllers/outstandingPrController.js';
const router = express.Router();

router.get('/master',get_outstanding_pr);
export default router;