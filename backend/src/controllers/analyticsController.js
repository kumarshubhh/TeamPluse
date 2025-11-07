import { topActiveRooms } from '../services/analyticsService.js';

export async function getTopActiveRooms(req, res, next) {
  try {
    const days = Number(req.query.days ?? 7);
    const limit = Number(req.query.limit ?? 10);
    const data = await topActiveRooms({ days, limit });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}


