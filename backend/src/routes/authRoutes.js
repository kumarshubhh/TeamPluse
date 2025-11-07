import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../schemas/auth.js';
import authGuard from '../middleware/authGuard.js';
import { signup, login, me } from '../controllers/authController.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', authGuard, me);

export default router;
