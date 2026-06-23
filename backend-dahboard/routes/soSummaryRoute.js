import express from 'express';
import { get_so_summary } from '../controllers/soSummaryController.js';
const router = express.Router();

router.get('/master',get_so_summary);
export default router;