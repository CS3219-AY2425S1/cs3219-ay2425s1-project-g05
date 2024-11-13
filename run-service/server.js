import express from 'express';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import router from './router.js';
import corsMiddleware from './middlewares/cors.js';
import loggingMiddleware from './middlewares/logging.js';
import errorHandler from "./middlewares/errorHandler.js";

const app = express();
const port = process.env.PORT || 8007;
dotenv.config();
app.use(express.json());

const questionServiceUrl = process.env.QUESTION_SVC_DEV;

// TODO: Replace with actual Redis connection instance
const redisClient = createClient({
  url: process.env.REDIS_URL_DEV ?? 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('ready', () => console.log('Redis Client Ready'));
await redisClient.connect();

app.use(loggingMiddleware);
app.use(corsMiddleware);
app.use('/api/run-service', router);

// Test Route for Health Checks
app.get('/healthz', (req, res) => {
  res
    .status(200)
    .json({ message: 'Connected to /healthz route of run-service' });
});

app.use(errorHandler);
app.listen(port, () => console.log(`run-service listening on port ${port}`));

export { redisClient, questionServiceUrl };
