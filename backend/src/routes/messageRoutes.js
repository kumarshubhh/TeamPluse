import { Router } from 'express';
import authGuard from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';
import { sendMessageSchema, paginateMessagesQuery, readReceiptSchema, roomIdParamSchema } from '../schemas/message.js';
import { sendMessage, getMessages, markRead } from '../controllers/messageController.js';

const router = Router();

router.use(authGuard);

router.get('/rooms/:roomId/messages', validate(roomIdParamSchema, 'params'), validate(paginateMessagesQuery, 'query'), getMessages);
router.post('/rooms/:roomId/messages', validate(roomIdParamSchema, 'params'), validate(sendMessageSchema), sendMessage);
router.post('/rooms/:roomId/read-receipts', validate(roomIdParamSchema, 'params'), validate(readReceiptSchema), markRead);

export default router;
