import express from 'express';
import uploadRoutes from './routes/upload.route.js';
import statusRoutes from './routes/status.route.js';
import { setupImageProcessor } from './workers/image.worker.js';

const app = express();

app.use('/api', uploadRoutes);
app.use('/api', statusRoutes);

// Set up the image processor
setupImageProcessor();

export default app;
