// permissions.js - room membership checks
import Room from '../models/Room.js';

export async function isRoomMember(userId, roomId) {
  const room = await Room.findById(roomId).lean();
  if (!room) return false;
  return room.members.some((id) => id.toString() === userId.toString());
}

export async function requireRoomMember(userId, roomId) {
  const isMember = await isRoomMember(userId, roomId);
  if (!isMember) {
    throw new Error('FORBIDDEN_ROOM_ACCESS');
  }
  return true;
}
