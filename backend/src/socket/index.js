import socketAuth from './socketAuth.js';
import logger from '../config/logger.js';
import { registerRoomHandlers } from './handlers/roomHandler.js';
import { registerMessageHandlers } from './handlers/messageHandler.js';
import { registerPresenceHandlers } from './handlers/presenceHandler.js';

export default function registerSocket(io) {
  socketAuth(io);

  io.on('connection', (socket) => {
    // Join personal notification room
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Register room handlers
    registerRoomHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      // minimal safe log
      logger.info({ id: socket.id, reason }, 'socket disconnected');
    });
  });
}
