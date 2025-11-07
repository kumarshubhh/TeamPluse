import logger from '../../config/logger.js';

// In-memory presence maps
const roomIdToOnlineUserIds = new Map(); // roomId -> Set(userId)
const userIdToProfile = new Map(); // userId -> { name, username }

function addOnline(roomId, userId, profile) {
  if (!roomId || !userId) return;
  if (!roomIdToOnlineUserIds.has(roomId)) roomIdToOnlineUserIds.set(roomId, new Set());
  roomIdToOnlineUserIds.get(roomId).add(userId);
  if (profile) userIdToProfile.set(userId, profile);
}

function removeOnline(roomId, userId) {
  if (!roomId || !userId) return;
  const set = roomIdToOnlineUserIds.get(roomId);
  if (!set) return;
  set.delete(userId);
  if (set.size === 0) roomIdToOnlineUserIds.delete(roomId);
}

export function registerPresenceHandlers(io, socket) {
  // typing events
  socket.on('typing:start', (data) => {
    const { roomId } = data || {};
    if (!roomId) return;
    io.to(`room:${roomId}`).emit('typing:start', {
      roomId,
      userId: socket.user?.id,
      name: socket.user?.name,
      username: socket.user?.username,
    });
  });

  socket.on('typing:stop', (data) => {
    const { roomId } = data || {};
    if (!roomId) return;
    io.to(`room:${roomId}`).emit('typing:stop', {
      roomId,
      userId: socket.user?.id,
      name: socket.user?.name,
      username: socket.user?.username,
    });
  });

  // presence list on join-room
  socket.on('join-room', ({ roomId } = {}) => {
    if (!roomId) return;
    const userId = socket.user?.id;
    addOnline(roomId, userId, { name: socket.user?.name, username: socket.user?.username });
    const users = Array.from(roomIdToOnlineUserIds.get(roomId) || []).map((id) => ({ id, ...userIdToProfile.get(id) }));
    io.to(`room:${roomId}`).emit('presence:list', { roomId, users });
  });

  // presence update on leave-room
  socket.on('leave-room', ({ roomId } = {}) => {
    if (!roomId) return;
    const userId = socket.user?.id;
    removeOnline(roomId, userId);
    io.to(`room:${roomId}`).emit('presence:offline', { roomId, userId });
  });

  // cleanup on disconnect: broadcast offline in all rooms this socket joined
  socket.on('disconnect', () => {
    try {
      const rooms = Array.from(socket.rooms || []);
      rooms.forEach((r) => {
        if (r.startsWith('room:')) {
          const roomId = r.split(':')[1];
          removeOnline(roomId, socket.user?.id);
          io.to(r).emit('presence:offline', { roomId, userId: socket.user?.id });
        }
      });
    } catch (e) {
      logger.warn({ e }, 'presence cleanup error');
    }
  });
}
