import express from 'express';
import { get_outstanding_dr } from '../controllers/outstandingDrController.js';
const router = express.Router();

router.get('/master',get_outstanding_dr);
export default router;