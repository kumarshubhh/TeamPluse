import Joi from 'joi';
import { JoiId, JoiISODate } from '../middleware/validate.js';

export const notificationsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
  before: JoiISODate.optional(),
  read: Joi.boolean().optional(),
});

export const notificationIdParam = Joi.object({
  id: JoiId.required(),
});


