import express from 'express';
import { checkStatus } from '../controllers/status.controller.js';

const router = express.Router();

router.get('/status/:requestId', checkStatus);

export default router;
