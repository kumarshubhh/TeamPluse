import Message from '../models/Message.js';

export async function topActiveRooms({ days = 7, limit = 10 }) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const pipeline = [
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$roomId', messageCount: { $sum: 1 }, lastMessageAt: { $max: '$createdAt' } } },
    { $sort: { messageCount: -1 } },
    { $limit: Number(limit) },
  ];
  const results = await Message.aggregate(pipeline);
  return results.map((r) => ({ roomId: r._id.toString(), messageCount: r.messageCount, lastMessageAt: r.lastMessageAt }));
}
