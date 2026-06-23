import express from 'express';
import { get_outstanding_gr } from '../controllers/outstandingGrController.js';
const router = express.Router();

router.get('/master',get_outstanding_gr);
export default router;