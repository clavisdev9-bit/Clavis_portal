import express from 'express';
import { get_pod_hand_over } from '../controllers/podHandOverController.js';
const router = express.Router();

router.get('/master',get_pod_hand_over);
export default router;