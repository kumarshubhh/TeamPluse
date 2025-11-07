import Joi from 'joi';
import { JoiId, JoiISODate } from '../middleware/validate.js';

export const sendMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required(),
  clientId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
});

export const paginateMessagesQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
  before: JoiISODate.optional(),
});

export const readReceiptSchema = Joi.object({
  messageId: JoiId.optional(),
  upToTimestamp: JoiISODate.optional(),
}).or('messageId', 'upToTimestamp');

export const roomIdParamSchema = Joi.object({
  roomId: JoiId.required(),
});


