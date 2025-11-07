// roomRoutes.js - room routes
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createRoomSchema, inviteSchema, roomIdParamSchema } from '../schemas/room.js';
import authGuard from '../middleware/authGuard.js';
import { createRoom, listRooms, getRoomDetails, inviteUser, deleteRoom } from '../controllers/roomController.js';

const router = Router();

router.use(authGuard);

router.post('/', validate(createRoomSchema), createRoom);
router.get('/', listRooms);
router.get('/:roomId', validate(roomIdParamSchema, 'params'), getRoomDetails);
router.post('/:roomId/invite', validate(roomIdParamSchema, 'params'), validate(inviteSchema), inviteUser);
router.delete('/:roomId', validate(roomIdParamSchema, 'params'), deleteRoom);

export default router;
