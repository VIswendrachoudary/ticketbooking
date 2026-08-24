import express from 'express';
import http from 'http';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { initSocket } from './socket.js';
import { startTtlWorker } from './jobs/ttlWorker.js';

export const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

// Start Background TTL Sweeper
startTtlWorker(5000);

const port = env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`🚀 Ticket Booking Backend running on http://localhost:${port}`);
  });
}

export default app;
