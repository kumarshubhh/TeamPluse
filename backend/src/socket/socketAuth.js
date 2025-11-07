import { verifyJwt } from '../utils/jwt.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

export default function socketAuth(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || null;
      if (!token) return next(new Error('AUTH_MISSING_TOKEN'));
      const decoded = verifyJwt(token);
      const user = await User.findById(decoded.sub).select('name username').lean();
      socket.user = { id: decoded.sub, username: user?.username, name: user?.name };

      // Auto-disconnect when token expires
      const expMs = decoded.exp ? decoded.exp * 1000 : null;
      if (expMs && expMs > Date.now()) {
        const timeout = expMs - Date.now();
        socket._authExpiryTimer = setTimeout(() => {
          try {
            socket.emit('error', { code: 'AUTH_EXPIRED', message: 'Token expired' });
            socket.disconnect(true);
          } catch (e) {
            logger.warn({ e }, 'Error during auth expiry disconnect');
          }
        }, timeout);
      }
      socket.on('disconnect', () => {
        if (socket._authExpiryTimer) clearTimeout(socket._authExpiryTimer);
      });
      return next();
    } catch (err) {
      return next(new Error('AUTH_INVALID_TOKEN'));
    }
  });
}
