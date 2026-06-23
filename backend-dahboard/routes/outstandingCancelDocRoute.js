import express from 'express';
import { get_outstanding_cancel_doc } from '../controllers/outstandingCancelDocController.js';
const router = express.Router();

router.get('/master',get_outstanding_cancel_doc);
export default router;