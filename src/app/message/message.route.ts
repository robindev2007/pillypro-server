
import express from 'express';
import { MessageController } from './message.controller';

const router = express.Router();

router.post('/', MessageController.create);
router.get('/', MessageController.getAll);
router.get('/:id', MessageController.getOne);
router.patch('/:id', MessageController.update);
router.delete('/:id', MessageController.remove);

export const MessageRoutes = router;
