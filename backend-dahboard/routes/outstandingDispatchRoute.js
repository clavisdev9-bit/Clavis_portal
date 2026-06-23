import express from 'express';
import { get_outstanding_dispatch } from '../controllers/outstandingDispatchController.js';
const router = express.Router();

router.get('/master',get_outstanding_dispatch);
export default router;