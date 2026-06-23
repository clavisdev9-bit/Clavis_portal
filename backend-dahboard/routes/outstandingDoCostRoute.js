import express from 'express';
import { get_outstanding_do_cost } from '../controllers/outstandingDoCostController.js';
const router = express.Router();

router.get('/master',get_outstanding_do_cost);
export default router;