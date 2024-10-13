/**
 * Adapted from https://github.com/yjs/y-websocket/blob/master/bin/server.cjs
 */
import express from 'express';
import corsMiddleware from './src/middlewares/cors.js';
import { createServer } from 'node:http';
import { config } from 'dotenv';
import { setupWSConnection } from './src/server/utils.cjs';
import { parseInt } from 'lib0/number';

import pkg from 'ws';
const { Server } = pkg;

// Set up env variables
config();

const host = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.HOST) || 8004;

// Create express app and websocket server
const app = express();
const websocketServer = new Server({
  noServer: true,
  cors: {
    origin: 'http://localhost:5173',
  },
});
const httpServer = createServer(app);

// Init middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// Test Route for Health Checks
app.get('/healthz', (request, response) => {
  response.status(200).json({
    message: 'Connected to the /healthz route of the collaboration-service',
  });
});

// Setup the websocketServer connection
websocketServer.on('connection', setupWSConnection);

// Upgrade requests to Websockets
httpServer.on('upgrade', (req, sock, head) => {
  websocketServer.handleUpgrade(req, sock, head, (soc) => {
    console.log('User Connected');
    websocketServer.emit('connection', soc, req);
  });
});

// Start the HTTP server
httpServer.listen(port, host, () => {
  console.log('Collaboration Service lcistening at port', port);
});
