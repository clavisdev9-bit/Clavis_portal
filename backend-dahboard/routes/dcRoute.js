import express from 'express';
import { get_dc } from '../controllers/dcController.js';
const router = express.Router();

router.get('/master',get_dc);
export default router;