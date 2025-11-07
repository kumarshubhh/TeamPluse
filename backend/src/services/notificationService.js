import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import logger from '../config/logger.js';

export async function createMentionNotifications({ io, roomId, fromUserId, messageId, content }) {
  const usernames = Array.from(new Set((content.match(/@([a-zA-Z0-9_]+)/g) || []).map((m) => m.slice(1))));
  if (usernames.length === 0) return [];
  
  const users = await User.find({ username: { $in: usernames } }, '_id').lean();
  if (!users.length) return [];
  
  // Get room and check/add mentioned users as members
  const room = await Room.findById(roomId);
  if (!room) {
    logger.warn({ roomId }, 'Room not found when creating mention notifications');
    return [];
  }
  
  const userIdsToAdd = [];
  const existingMembers = new Set(room.members.map(m => m.toString()));
  
  // Check which mentioned users are not already members
  users.forEach((user) => {
    const userIdStr = user._id.toString();
    if (!existingMembers.has(userIdStr)) {
      userIdsToAdd.push(user._id);
    }
  });
  
  // Automatically add mentioned users to the room if they're not members
  if (userIdsToAdd.length > 0) {
    room.members.push(...userIdsToAdd);
    await room.save();
    logger.info({ roomId, addedUsers: userIdsToAdd.length }, 'Auto-added mentioned users to room');
    
    // Emit room update event so users see the room in their list
    if (io) {
      userIdsToAdd.forEach((userId) => {
        io.to(`user:${userId.toString()}`).emit('room:joined', { roomId: roomId.toString(), roomName: room.name });
      });
    }
  }
  
  // Create mention notifications for all mentioned users
  const docs = users.map((u) => ({ userId: u._id, type: 'mention', roomId, fromUserId, messageId }));
  const created = await Notification.insertMany(docs);
  
  // Emit socket events for notifications
  created.forEach((n) => {
    io.to(`user:${n.userId.toString()}`).emit('notification:created', toDTO(n));
  });
  
  return created;
}

export async function createInviteNotification({ io, roomId, fromUserId, userId }) {
  const n = await Notification.create({ userId, type: 'invite', roomId, fromUserId });
  io.to(`user:${userId.toString()}`).emit('notification:created', toDTO(n));
  return n;
}

export async function createRoomDeletedNotifications({ io, roomId, roomName, deletedByUserId, memberIds }) {
  // Create notifications for all room members except the deleter
  const notificationsToCreate = memberIds
    .filter((memberId) => memberId.toString() !== deletedByUserId.toString())
    .map((memberId) => ({
      userId: memberId,
      type: 'room_deleted',
      roomId, // Keep roomId for reference even after room is deleted
      fromUserId: deletedByUserId,
    }));

  if (notificationsToCreate.length === 0) return [];

  // Create notifications in database
  const created = await Notification.insertMany(notificationsToCreate);

  // Emit socket events to all affected users
  created.forEach((n) => {
    io.to(`user:${n.userId.toString()}`).emit('notification:created', toDTO(n));
  });

  return created;
}

export function toDTO(n) {
  return {
    id: n._id.toString(),
    userId: n.userId?.toString?.() || n.userId,
    type: n.type,
    roomId: n.roomId?.toString?.() || n.roomId,
    fromUserId: n.fromUserId?.toString?.() || n.fromUserId,
    messageId: n.messageId?.toString?.() || n.messageId,
    read: !!n.read,
    createdAt: n.createdAt,
  };
}
