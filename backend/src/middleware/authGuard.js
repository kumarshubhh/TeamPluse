import { getBearerToken, verifyJwt } from '../utils/jwt.js';

export default function authGuard(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_MISSING_TOKEN', message: 'Authorization token required' } });
    }
    const decoded = verifyJwt(token);
    req.user = { id: decoded.sub, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid or expired token' } });
  }
}
