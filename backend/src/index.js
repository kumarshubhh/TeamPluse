import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import registerSocket from './socket/index.js';
import { validateEnv } from './config/env.js';
import logger from './config/logger.js';
import './models/User.js';
import './models/Room.js';
import './models/Message.js';
import './models/Notification.js';

dotenv.config();
validateEnv();

const port = process.env.PORT || 4000;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  path: process.env.SOCKET_PATH || '/socket.io',
});

// Expose io to REST controllers via app
app.set('io', io);

registerSocket(io);

async function start() {
  try {
    await connectDB();
    logger.info('MongoDB connected');
    server.listen(port, () => {
      logger.info({ port }, 'API listening');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
