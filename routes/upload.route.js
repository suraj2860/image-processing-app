import express from 'express';
import { upload, uploadCsv } from '../controllers/upload.controller.js';

const router = express.Router();

router.post('/upload', upload.single('file'), uploadCsv);

export default router;
