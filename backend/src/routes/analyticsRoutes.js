import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';
import { getTopActiveRooms } from '../controllers/analyticsController.js';

const router = Router();

const querySchema = Joi.object({
  days: Joi.number().integer().min(1).max(90).default(7),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

router.use(authGuard);
router.get('/analytics/top-rooms', validate(querySchema, 'query'), getTopActiveRooms);

export default router;

