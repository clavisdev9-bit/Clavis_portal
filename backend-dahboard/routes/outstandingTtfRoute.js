import express from 'express';
import { get_outstanding_ttf } from '../controllers/outstandingTtfController.js';
const router = express.Router();

router.get('/master',get_outstanding_ttf);
export default router;