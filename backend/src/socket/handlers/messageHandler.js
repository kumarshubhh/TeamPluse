import { sanitizeMessageContent } from '../../utils/sanitizer.js';
import { isRoomMember } from '../../utils/permissions.js';
import Message from '../../models/Message.js';
import Room from '../../models/Room.js';
import User from '../../models/User.js';
import { createMentionNotifications } from '../../services/notificationService.js';
import logger from '../../config/logger.js';

export function registerMessageHandlers(io, socket) {
  socket.on('new-message', async (data, callback) => {
    try {
      const { roomId, content, clientId } = data || {};
      const userId = socket.user?.id;
      if (!roomId || !content) {
        return callback?.({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'roomId and content required' } });
      }
      const ok = await isRoomMember(userId, roomId);
      if (!ok) {
        return callback?.({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
      }

      const clean = sanitizeMessageContent(content);
      if (!clean) return callback?.({ success: false, error: { code: 'EMPTY_MESSAGE', message: 'Message cannot be empty' } });
      const msg = await Message.create({ roomId, senderId: userId, content: clean });
      await Room.findByIdAndUpdate(roomId, { $set: { lastMessageAt: msg.createdAt } });

      // Get sender info for display
      const sender = await User.findById(userId).select('name username').lean();
      const displayName = sender?.name || sender?.username || socket.user?.username;

      const payload = {
        id: msg._id.toString(),
        roomId: roomId.toString(),
        senderId: userId.toString(),
        username: displayName,
        content: clean,
        createdAt: msg.createdAt,
        readBy: [], // New message, no one has read it yet
      };
      
      io.to(`room:${roomId}`).emit('message:created', payload);

      // Mentions notifications
      await createMentionNotifications({ io, roomId, fromUserId: userId, messageId: msg._id, content: clean });

      callback?.({ success: true, data: payload });
    } catch (err) {
      logger.error({ err }, 'Error in new-message');
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to send message' } });
    }
  });

  socket.on('message:read', async (data, callback) => {
    try {
      const { roomId, messageId } = data || {};
      const userId = socket.user?.id;
      if (!roomId || !messageId) {
        return callback?.({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'roomId and messageId required' } });
      }
      
      const ok = await isRoomMember(userId, roomId);
      if (!ok) {
        return callback?.({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
      }
      
      // Get message to check if user is sender
      const msg = await Message.findById(messageId).select('senderId readBy').lean();
      if (!msg) {
        return callback?.({ success: false, error: { code: 'MESSAGE_NOT_FOUND', message: 'Message not found' } });
      }
      
      // Skip if user is the sender (senders don't mark their own messages as read)
      if (msg.senderId?.toString() === userId.toString()) {
        return callback?.({ success: true });
      }
      
      // Check if already read
      const alreadyRead = (msg.readBy || []).some((r) => r.userId?.toString() === userId.toString());
      if (alreadyRead) {
        return callback?.({ success: true });
      }
      
      // Mark as read
      const now = new Date();
      await Message.updateOne(
        { _id: messageId },
        { $addToSet: { readBy: { userId, at: now } } }
      );
      
      // Emit read receipt to room
      io.to(`room:${roomId}`).emit('message:read', {
        roomId: roomId.toString(),
        messageId: messageId.toString(),
        userId: userId.toString(),
        at: now,
      });
      
      callback?.({ success: true });
    } catch (err) {
      logger.error({ err }, 'Error in message:read');
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark read' } });
    }
  });
}
