import jwt from 'jsonwebtoken';

export function signJwt(payload, options = {}) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '30m';
  return jwt.sign(payload, secret, { expiresIn, ...options });
}

export function verifyJwt(token) {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}

export function getBearerToken(headerValue) {
  if (!headerValue) return null;
  const [type, token] = headerValue.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}
