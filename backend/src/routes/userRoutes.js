import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';
import { updateStatus, updateProfile } from '../controllers/authController.js';
import { updateProfileSchema } from '../schemas/auth.js';
import User from '../models/User.js';

const router = Router();

router.patch('/users/status', authGuard, validate(Joi.object({ status: Joi.string().valid('online', 'offline').required() })), updateStatus);
router.patch('/users/profile', authGuard, validate(updateProfileSchema), updateProfile);

// Lookup user by username → returns minimal profile including _id
router.get('/users', authGuard, validate(Joi.object({ username: Joi.string().min(1).required() }), 'query'), async (req, res, next) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username }).select('_id username email status').lean();
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

export default router;

