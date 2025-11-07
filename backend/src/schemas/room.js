import Joi from 'joi';
import { JoiId } from '../middleware/validate.js';

export const createRoomSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
});

export const inviteSchema = Joi.object({
  userId: JoiId.required(),
});

export const roomIdParamSchema = Joi.object({
  roomId: JoiId.required(),
});


