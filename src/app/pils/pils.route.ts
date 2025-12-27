
import express from 'express';
import { PilsController } from './pils.controller';

const router = express.Router();

router.post('/', PilsController.create);
router.get('/', PilsController.getAll);
router.get('/:id', PilsController.getOne);
router.patch('/:id', PilsController.update);
router.delete('/:id', PilsController.remove);

export const PilsRoutes = router;
