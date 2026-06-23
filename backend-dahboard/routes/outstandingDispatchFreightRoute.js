import express from 'express';
import { get_outstanding_dispatch_freight } from '../controllers/outstandingDispatchFreightController.js';
const router = express.Router();

router.get('/master',get_outstanding_dispatch_freight);
export default router;