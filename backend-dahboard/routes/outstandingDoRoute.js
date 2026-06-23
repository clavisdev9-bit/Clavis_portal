import express from 'express';
import { get_outstanding_do } from '../controllers/outstandingDoController.js';
const router = express.Router();

router.get('/master',get_outstanding_do);
export default router;