// roomController.js - room CRUD/invite
import Room from '../models/Room.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import { requireRoomMember, isRoomMember } from '../utils/permissions.js';
import logger from '../config/logger.js';
import { createInviteNotification, createRoomDeletedNotifications } from '../services/notificationService.js';

export async function createRoom(req, res, next) {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    const room = await Room.create({
      name,
      createdBy: userId,
      members: [userId],
    });
    const populated = await Room.findById(room._id)
      .populate('members', 'username email')
      .populate('createdBy', 'username email')
      .lean();
    logger.info({ roomId: room._id, userId }, 'Room created');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function listRooms(req, res, next) {
  try {
    const userId = req.user.id;
    const rooms = await Room.find({ members: userId })
      .populate('members', 'username email')
      .populate('createdBy', 'username email')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();
    return res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
}

export async function getRoomDetails(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    await requireRoomMember(userId, roomId);
    const room = await Room.findById(roomId)
      .populate('members', 'username email')
      .populate('createdBy', 'username email')
      .lean();
    if (!room) {
      return res.status(404).json({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });
    }
    return res.json({ success: true, data: room });
  } catch (err) {
    if (err.message === 'FORBIDDEN_ROOM_ACCESS') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
    }
    next(err);
  }
}

export async function inviteUser(req, res, next) {
  try {
    const { roomId } = req.params;
    const { userId: inviteeId } = req.body;
    const inviterId = req.user.id;
    await requireRoomMember(inviterId, roomId);
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });
    }
    const isAlreadyMember = room.members.some((id) => id.toString() === inviteeId.toString());
    if (isAlreadyMember) {
      return res.status(409).json({ success: false, error: { code: 'USER_ALREADY_MEMBER', message: 'User is already a member' } });
    }
    const user = await User.findById(inviteeId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    room.members.push(inviteeId);
    await room.save();
    // Emit invite notification
    await createInviteNotification({ io: req.app.get('io'), roomId, fromUserId: inviterId, userId: inviteeId });
    const populated = await Room.findById(roomId)
      .populate('members', 'username email')
      .populate('createdBy', 'username email')
      .lean();
    logger.info({ roomId, inviterId, inviteeId }, 'User invited to room');
    return res.json({ success: true, data: populated });
  } catch (err) {
    if (err.message === 'FORBIDDEN_ROOM_ACCESS') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN_ROOM_ACCESS', message: 'You are not a member of this room' } });
    }
    next(err);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if room exists and user is the creator
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });
    }

    // Only room creator can delete the room
    if (room.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: { 
          code: 'FORBIDDEN_DELETE', 
          message: 'Only the room creator can delete this room' 
        } 
      });
    }

    // Get room members before deletion (for notifications and socket events)
    const members = room.members.map(m => (m._id ? m._id.toString() : m.toString()));
    const roomName = room.name;
    const io = req.app.get('io');

    // Create room deletion notifications for all members (except creator)
    // Do this BEFORE deleting the room so we can reference it
    if (io && members.length > 0) {
      await createRoomDeletedNotifications({
        io,
        roomId,
        roomName,
        deletedByUserId: userId,
        memberIds: members,
      });
      logger.info({ roomId, memberCount: members.length }, 'Created room deletion notifications');
    }

    // Cascade delete: Delete all messages in this room
    const messagesDeleted = await Message.deleteMany({ roomId });
    logger.info({ roomId, count: messagesDeleted.deletedCount }, 'Deleted all messages in room');

    // Cascade delete: Delete old notifications (mention/invite) related to this room
    // BUT keep room_deleted notifications so users can see them
    const notificationsDeleted = await Notification.deleteMany({ 
      roomId,
      type: { $in: ['mention', 'invite'] } // Only delete mention/invite, keep room_deleted
    });
    logger.info({ roomId, count: notificationsDeleted.deletedCount }, 'Deleted old notifications for room');

    // Delete the room itself
    await Room.findByIdAndDelete(roomId);
    logger.info({ roomId, userId }, 'Room deleted by creator');

    // Emit socket event to all room members to notify them in real-time
    if (io) {
      // Emit to room channel first (all members in room)
      io.to(`room:${roomId}`).emit('room:deleted', { roomId, roomName });
      // Also emit to individual user channels if they exist
      members.forEach(memberId => {
        io.to(`user:${memberId}`).emit('room:deleted', { roomId, roomName });
      });
    }

    return res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    logger.error({ err, roomId: req.params.roomId, userId: req.user?.id }, 'Error deleting room');
    next(err);
  }
}
