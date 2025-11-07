import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { sanitizeMessageContent } from '../utils/sanitizer.js';
import { requireRoomMember } from '../utils/permissions.js';
import { createMentionNotifications } from '../services/notificationService.js';
import User from '../models/User.js';

export async function sendMessage(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    await requireRoomMember(userId, roomId);
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });

    const content = sanitizeMessageContent(req.body.content);
    if (!content) return res.status(400).json({ success: false, error: { code: 'EMPTY_MESSAGE', message: 'Message cannot be empty' } });

    const msg = await Message.create({ roomId, senderId: userId, content });
    room.lastMessageAt = msg.createdAt;
    await room.save();

    // Mentions notifications
    await createMentionNotifications({ io: req.app.get('io'), roomId, fromUserId: userId, messageId: msg._id, content });
    // Emit new message to room for real-time update (parity with socket handler)
    const io = req.app.get('io');
    const sender = await User.findById(userId).select('name username').lean();
    const display = sender?.name || sender?.username;
    if (io) {
      const payload = { id: msg._id.toString(), roomId: roomId.toString(), senderId: userId.toString(), username: display, content, createdAt: msg.createdAt, readBy: [] };
      io.to(`room:${roomId}`).emit('message:created', payload);
    }

    return res.status(201).json({ success: true, data: toDTO({ ...msg.toObject(), senderId: { name: sender?.name, username: sender?.username } }) });
  } catch (err) {
    if (err.message === 'FORBIDDEN_ROOM_ACCESS') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
    }
    next(err);
  }
}

export async function getMessages(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    await requireRoomMember(userId, roomId);
    const { limit = 20, before } = req.query;
    const query = { roomId };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('senderId', 'name username')
      .lean();
    const data = messages.reverse().map((m) => toDTO(m));
    const nextBefore = messages.length ? messages[messages.length - 1].createdAt : null;
    return res.json({ success: true, data, nextBefore });
  } catch (err) {
    if (err.message === 'FORBIDDEN_ROOM_ACCESS') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
    }
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    await requireRoomMember(userId, roomId);
    const { messageId, upToTimestamp } = req.body;

    const filter = { roomId };
    if (messageId) {
      filter._id = messageId;
    } else if (upToTimestamp) {
      filter.createdAt = { $lte: new Date(upToTimestamp) };
    }
    
    // Find messages that need read receipts
    const msgs = await Message.find(filter).select('_id readBy senderId').lean();
    const now = new Date();
    
    // Prepare bulk update operations
    const ops = [];
    const updatedMessages = [];
    
    for (const m of msgs) {
      // Skip if user is the sender (sender doesn't mark their own messages as read)
      if (m.senderId?.toString() === userId.toString()) continue;
      
      // Check if user already read this message
      const alreadyRead = (m.readBy || []).some((r) => r.userId?.toString() === userId.toString());
      if (alreadyRead) continue;
      
      ops.push({
        updateOne: {
          filter: { _id: m._id },
          update: { $addToSet: { readBy: { userId, at: now } } },
        },
      });
      
      updatedMessages.push({
        messageId: m._id.toString(),
        userId: userId.toString(),
        at: now,
      });
    }
    
    // Execute bulk update
    if (ops.length > 0) {
      await Message.bulkWrite(ops);
    }
    
    // Emit read receipts to room so senders see live "seen" updates
    const io = req.app.get('io');
    if (io && updatedMessages.length > 0) {
      updatedMessages.forEach((msg) => {
        io.to(`room:${roomId}`).emit('message:read', {
          roomId: roomId.toString(),
          messageId: msg.messageId,
          userId: msg.userId,
          at: msg.at,
        });
      });
    }
    
    return res.json({ success: true });
  } catch (err) {
    if (err.message === 'FORBIDDEN_ROOM_ACCESS') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
    }
    next(err);
  }
}

function toDTO(m) {
  return {
    id: m._id?.toString?.() || m._id,
    roomId: m.roomId?.toString?.() || m.roomId,
    senderId: m.senderId?._id?.toString?.() || m.senderId?.toString?.() || m.senderId,
    username: m.senderId?.username || m.senderId?.name || m.username,
    content: m.content,
    createdAt: m.createdAt,
    readBy: (m.readBy || []).map((r) => ({
      userId: r.userId?.toString?.() || r.userId,
      at: r.at || r.createdAt || new Date(),
    })),
  };
}
