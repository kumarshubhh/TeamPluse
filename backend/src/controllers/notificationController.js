import Notification from '../models/Notification.js';

export async function listNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { limit = 20, before, read } = req.query;
    const filter = { userId };
    if (before) filter.createdAt = { $lt: new Date(before) };
    if (read !== undefined) filter.read = read === 'true';
    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    const nextBefore = items.length ? items[items.length - 1].createdAt : null;
    return res.json({ success: true, data: items.map(toDTO), nextBefore });
  } catch (err) { next(err); }
}

export async function markRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const n = await Notification.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, { new: true });
    if (!n) return res.status(404).json({ success: false, error: { code: 'NOTIF_NOT_FOUND', message: 'Notification not found' } });
    req.app.get('io').to(`user:${userId}`).emit('notification:read', { id: n._id.toString() });
    return res.json({ success: true, data: toDTO(n) });
  } catch (err) { next(err); }
}

export async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    req.app.get('io').to(`user:${userId}`).emit('notification:read', { id: 'ALL' });
    return res.json({ success: true });
  } catch (err) { next(err); }
}

function toDTO(n) {
  return {
    id: n._id?.toString?.() || n._id,
    userId: n.userId?.toString?.() || n.userId,
    type: n.type,
    roomId: n.roomId?.toString?.() || n.roomId,
    fromUserId: n.fromUserId?.toString?.() || n.fromUserId,
    messageId: n.messageId?.toString?.() || n.messageId,
    read: !!n.read,
    createdAt: n.createdAt,
  };
}
