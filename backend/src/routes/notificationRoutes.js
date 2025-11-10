import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';
import { notificationsQuery, notificationIdParam } from '../schemas/notification.js';
import { listNotifications, markRead, markAllRead, deleteNotification } from '../controllers/notificationController.js';

const router = Router();

router.use(authGuard);

router.get('/notifications', validate(notificationsQuery, 'query'), listNotifications);
router.post('/notifications/:id/read', validate(notificationIdParam, 'params'), markRead);
router.post('/notifications/read-all', markAllRead);
router.delete('/notifications/:id', validate(notificationIdParam, 'params'), deleteNotification);

export default router;
