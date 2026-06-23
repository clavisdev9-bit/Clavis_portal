import express from 'express';
import { get_outstanding_pod_cost } from '../controllers/outstandingPodCostController.js';
const router = express.Router();

router.get('/master',get_outstanding_pod_cost);
export default router;