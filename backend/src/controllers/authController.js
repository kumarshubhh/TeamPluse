import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signJwt } from '../utils/jwt.js';

export async function signup(req, res, next) {
  try {
    const { name, username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'Username or email already in use' } });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, passwordHash });
    // Set status online immediately after signup so dashboard reflects presence
    user.status = 'online';
    await user.save();
    const token = signJwt({ sub: user._id.toString(), username: user.username });
    return res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { username: identifier };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    }
    // Update status to online on login
    user.status = 'online';
    await user.save();
    const token = signJwt({ sub: user._id.toString(), username: user.username });
    return res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    // Fetch full user details from database
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    // Remove passwordHash from response (already handled by model toJSON, but extra safety)
    const { passwordHash, __v, ...userData } = user;
    return res.json({ success: true, data: { user: userData } });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be online or offline' } });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { status }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    return res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;
    
    // Check if email is being updated and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } }).lean();
      if (existingUser) {
        return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already in use' } });
      }
    }
    
    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).lean();
    
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    // Remove sensitive fields
    const { passwordHash, __v, ...userData } = user;
    return res.json({ success: true, data: { user: userData } });
  } catch (err) {
    // Handle duplicate key error (MongoDB unique constraint)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        success: false, 
        error: { 
          code: `${field.toUpperCase()}_EXISTS`, 
          message: `${field === 'email' ? 'Email' : 'Username'} already in use` 
        } 
      });
    }
    next(err);
  }
}
