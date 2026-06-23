import express from 'express';
import { get_outstanding_pi } from '../controllers/outstandingPiController.js';
const router = express.Router();

router.get('/master',get_outstanding_pi);
export default router;