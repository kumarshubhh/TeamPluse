// roomHandler.js - join/leave room handlers
import { isRoomMember } from '../../utils/permissions.js';
import logger from '../../config/logger.js';

export function registerRoomHandlers(io, socket) {
  socket.on('join-room', async (data, callback) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        return callback?.({ success: false, error: { code: 'INVALID_ROOM_ID', message: 'Room ID required' } });
      }
      const userId = socket.user?.id;
      if (!userId) {
        return callback?.({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
      }
      const isMember = await isRoomMember(userId, roomId);
      if (!isMember) {
        return callback?.({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
      }
      const roomKey = `room:${roomId}`;
      socket.join(roomKey);
      logger.info({ roomId, userId, socketId: socket.id }, 'User joined room');
      callback?.({ success: true, roomId });
      socket.emit('room-joined', { roomId });
    } catch (err) {
      logger.error({ err, roomId: data?.roomId, userId: socket.user?.id }, 'Error joining room');
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to join room' } });
    }
  });

  socket.on('leave-room', async (data, callback) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        return callback?.({ success: false, error: { code: 'INVALID_ROOM_ID', message: 'Room ID required' } });
      }
      const roomKey = `room:${roomId}`;
      socket.leave(roomKey);
      logger.info({ roomId, userId: socket.user?.id, socketId: socket.id }, 'User left room');
      callback?.({ success: true, roomId });
      socket.emit('room-left', { roomId });
    } catch (err) {
      logger.error({ err, roomId: data?.roomId }, 'Error leaving room');
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to leave room' } });
    }
  });
}
