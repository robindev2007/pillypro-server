
import express from 'express';
import { DoseController } from './dose.controller';

const router = express.Router();

router.post('/', DoseController.create);
router.get('/', DoseController.getAll);
router.get('/:id', DoseController.getOne);
router.patch('/:id', DoseController.update);
router.delete('/:id', DoseController.remove);

export const DoseRoutes = router;
